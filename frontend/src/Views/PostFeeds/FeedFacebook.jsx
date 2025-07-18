import React, { useEffect, useState } from 'react';
import {
    Box, Sheet, Table, Button, Typography, IconButton, Card, CardContent,
    Stack, CircularProgress
} from "@mui/joy";
import { Grid2 } from '@mui/material';
import { newGetFacebook } from '../../Api/newFacebook';
import { ChatPageStyle } from '../../styles/ChatPageStyle';

import CommentsModal from './src/components/CommentsModal';
import EditPostModal from './src/components/EditPostModal';
import CreatePostModal from './src/components/CreatePostModal';
import axiosClient from '../../Axios';

const card_arrs = ['ทั้งหมด', 'เผยแพร่แล้ว', 'ร่าง', 'ไลค์รวม'];
const BreadcrumbsPath = [{ name: "Feed Facebook" }, { name: "รายละเอียด" }];

function BreadcrumbsComponent({ list }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            {list.map((item, index) => (
                <React.Fragment key={index}>
                    <Typography level="body-sm" sx={{ color: index === list.length - 1 ? "primary.500" : "text.tertiary" }}>
                        {item.name}
                    </Typography>
                    {index < list.length - 1 && <Typography level="body-sm" sx={{ color: "text.tertiary" }}>{'>'}</Typography>}
                </React.Fragment>
            ))}
        </Box>
    );
}

export default function FeedFacebook() {
    const [posts, setPosts] = useState([]);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [commentsModalOpen, setCommentsModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [platformTokens, setPlatformTokens] = useState([]);

    useEffect(() => {
        fetchData().finally(() => setLoading(false));
    }, []);

    const fetchData = async () => {
        try {
            // ดึงข้อมูลโพสต์ Facebook
            const { data: facebookPagesData } = await newGetFacebook();
            console.log("ข้อมูลโพสต์ Facebook:", facebookPagesData);
            // ตรวจสอบโครงสร้างข้อมูลที่ถูกต้องก่อนตั้งค่า state
            if (facebookPagesData && facebookPagesData.page_list) {
                setPosts(facebookPagesData.page_list);
            } else {
                console.warn("API response for Facebook posts does not contain 'page_list'.", facebookPagesData);
                setPosts([]);
            }

            // ดึงข้อมูล Platform Tokens (เช่น Facebook Pages)
            const { data: platformTokenData, status } = await axiosClient.post('tokens/platform_list', {
                platform: 'facebook' // ระบุ platform ที่ต้องการ
            });
            console.log("ข้อมูล Platform Tokens:", platformTokenData, status);
            if (status === 200 && platformTokenData && platformTokenData.platform_list) {
                setPlatformTokens(platformTokenData.platform_list);
            } else {
                console.warn("API response for platform tokens does not contain 'platform_list'.", platformTokenData);
                setPlatformTokens([]);
            }

        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
            // คุณอาจต้องการแสดงข้อความแจ้งเตือนผู้ใช้ถึงข้อผิดพลาดที่เกิดขึ้น
        } finally {
            setLoading(false); // ปิดสถานะ loading เมื่อการดึงข้อมูลเสร็จสิ้น
        }
    };

    const handleViewComments = (post) => {
        setSelectedPost(post);
        setCommentsModalOpen(true);
    };

    const handleEditPost = (post) => {
        setSelectedPost(post);
        setEditModalOpen(true);
    };

    const saveEditedPost = async (updatedPost) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/facebook/posts/${updatedPost.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: updatedPost.message,
                }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Unknown error');

            alert('✅ แก้ไขโพสต์สำเร็จ');
            setEditModalOpen(false);
            setSelectedPost(null);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (post) => {
        if (!window.confirm('คุณแน่ใจว่าต้องการลบโพสต์นี้หรือไม่?')) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/facebook/posts/${post.id}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.message || 'Unknown error');
            }

            alert('✅ ลบโพสต์สำเร็จ');
            fetchData();
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box sx={ChatPageStyle.MainContent}>
                <Box component="main">
                    <BreadcrumbsComponent list={BreadcrumbsPath} />

                    <Grid2 container spacing={2}>
                        <Grid2 size={12}>
                            <Stack direction='row' justifyContent='space-between'>
                                <Typography level="h2" component="h1">
                                    จัดการโพสต์ Facebook
                                </Typography>
                                <Button
                                    onClick={() => setCreateModalOpen(true)}
                                    size="lg"
                                >
                                    + สร้างโพสต์ใหม่
                                </Button>
                            </Stack>
                        </Grid2>

                        {card_arrs.map((card, index) => (
                            <Grid2 size={{ xs: 12, md: 4, lg: 3 }} key={index}>
                                <Card >
                                    <CardContent>
                                        <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>{card}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid2>
                        ))}

                        <Grid2 xs={12}>
                            {loading ? (
                                <CircularProgress />
                            ) : (
                                <Table stickyHeader>
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>รูปภาพ</th>
                                            <th>โพสต์</th>
                                            <th>ผู้เขียน</th>
                                            <th>วันที่เผยแพร่</th>
                                            <th>การมีส่วนร่วม</th>
                                            <th>การดำเนินการ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {posts.map((item, index) => (
                                            <React.Fragment key={index}>
                                                {item.list.map((post, i) => {
                                                    const fallbackImage = 'https://images.dcpumpkin.com/images/product/500/default.jpg';
                                                    return (
                                                        <tr key={i}>
                                                            <td>{i + 1}</td>
                                                            <td>
                                                                <img
                                                                    src={post.full_picture || fallbackImage}
                                                                    alt={post.message || 'Facebook post image'}
                                                                    height={80}
                                                                    width={80}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = fallbackImage;
                                                                    }}
                                                                />
                                                            </td>
                                                            <td>{post.message || '-'}</td>
                                                            <td>{post.from?.name || '-'}</td>
                                                            <td>{new Date(post.created_time).toLocaleString() || '-'}</td>
                                                            <td>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                    <Typography level="body-xs">❤️ {post.likes?.summary?.total_count ?? 0}</Typography>
                                                                    <Typography level="body-xs">💬 {post.comments?.summary?.total_count ?? 0}</Typography>
                                                                    <Typography level="body-xs">🔄 {post.shares?.count ?? 0}</Typography>
                                                                </Box>
                                                            </td>
                                                            <td>
                                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                                    <IconButton size="sm" variant="soft" color="primary"
                                                                        onClick={() => handleViewComments(post)}
                                                                        title="ดูคอมเมนต์"
                                                                    >
                                                                        👁️
                                                                    </IconButton>
                                                                    <IconButton size="sm" variant="soft" color="warning"
                                                                        onClick={() => handleEditPost(post)}
                                                                        title="แก้ไขโพสต์"
                                                                    >
                                                                        ✏️
                                                                    </IconButton>
                                                                    <IconButton size="sm" variant="soft" color="danger"
                                                                        onClick={() => handleDeletePost(post)}
                                                                        title="ลบโพสต์"
                                                                    >
                                                                        🗑️
                                                                    </IconButton>
                                                                </Box>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Grid2>

                        <Grid2 xs={12}>
                            <Stack direction="row" justifyContent="space-between">
                                <Button startDecorator={'<'}>prev</Button>
                                <Button endDecorator={'>'}>next</Button>
                            </Stack>
                        </Grid2>
                    </Grid2>
                </Box>
            </Box>

            {/* Modal ต่าง ๆ */}
            <CreatePostModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreated={() => {
                    setCreateModalOpen(false);
                    fetchData(); // ดึงข้อมูลโพสต์ใหม่เมื่อสร้างโพสต์สำเร็จ
                }}
                platformTokens={platformTokens} // ส่ง platformTokens ไปให้ CreatePostModal
            />

            <CommentsModal
                open={commentsModalOpen}
                onClose={() => setCommentsModalOpen(false)}
                post={selectedPost}
            />

            <EditPostModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                post={selectedPost}
                onSave={saveEditedPost}
            />
        </Sheet>
    );
}
