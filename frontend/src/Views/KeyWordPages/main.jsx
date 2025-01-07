import { useEffect, useState } from "react"
import { createKeywordApi, deleteKeywordApi, KeywordListApi, updateKeywordApi } from "../../Api/Keyword";
import {Box, Button, Card, Input, Select, Sheet,Option } from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../components/Breadcrumbs";
import { Grid2 } from "@mui/material";

const BreadcrumbsPath = [{ name: 'จัดการ Keyword' }, { name: 'รายละเอียด' }];

export default function KeyWordPage() {
    const [keyword, setKeyWord] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data, status } = await KeywordListApi();
        if (status === 200) {
            setKeyWord(data.keywords);
            setChatRooms(data.chatRooms);
        }
    }

    const createKeyword = async () => {
        const {data, status} = await createKeywordApi({keyword: 'test'});
        console.log(data, status);
    }

    const updateKeyword = async () => {
        const {data, status} = await updateKeywordApi({keyword: 'test',keywordId : 1});
        console.log(data, status);
    }

    const deleteKeyword = async () => {
        const {data, status} = await deleteKeywordApi({keywordId: 1});
        console.log(data, status);
    }
    
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Grid2 container spacing={2}>
                    <Grid2 size={{xs:12, md: 4}}>
                        <Input placeholder="keyword"/>
                    </Grid2>
                    <Grid2 size={{xs:12, md: 4}}>
                        <Select onChange={(e, newValue) => alert(newValue)}>
                            {chatRooms.map((item, index) => (
                                <Option key={index} value={item.roomId}>{item.roomName}</Option>
                            ))}
                        </Select>
                    </Grid2>
                    <Grid2 size={{xs:12, md: 4}}>
                        <Button>Click</Button>
                    </Grid2>
                    <Grid2 size={12}>
                        รายการ
                    </Grid2>
                    {keyword.map((item, index) => (
                        <Grid2 size={{ xs: 12, md: 3 }} key={index}>
                            <Card variant="soft" color="primary">
                                {item.keyword}
                                {item.redirectTo}
                            </Card>
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
        </Sheet>
    )
}