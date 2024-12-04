import { Avatar, Box, Card, Chip, Sheet, Typography } from "@mui/joy";
import { useAuth } from "../../context/AuthContext"
import { Grid2 } from "@mui/material";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../components/Breadcrumbs";
import authStyle from './authStyle.module.css';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

const BreadcrumbsPath = [{ name: 'AuthPages' }, { name: 'รายละเอียด' }];

export default function AuthPages() {
    const { user } = useAuth();
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Sheet variant="outlined" sx={[ChatPageStyle.BoxSheet, { border: "none" }]}>
                    <Grid2 container spacing={2}>
                        <Grid2 size={{xs : 12,lg : 3,sm : 6}}>
                            <div className={authStyle.Card}>
                                <div className={authStyle.Cover}>
                                    <div style={{ display: "flex", justifyContent: 'center', alignItems: 'center' }}>
                                        <Avatar sx={{ height: 100, width: 100 }} src={user.avatar} />
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <Typography fontSize={20} textColor={'white'} fontWeight={'bold'}>{user.name}&nbsp;({user.empCode})</Typography>
                                        <Chip size="sm" variant="soft">รหัสพนักงาน {user.empCode}</Chip>
                                        &nbsp;
                                        <Chip startDecorator={<ManageAccountsIcon />} size="sm" variant="soft">{user.role}</Chip>
                                        <Card style={{borderRadius : 5,marginTop : 10,padding : 10}}>
                                            <div style={{display : 'flex', justifyContent : 'space-around',alignItems : 'center'}}>
                                                <div>
                                                    <p style={{fontSize : 20 ,fontWeight : 'bold',color : '#b25d03'}}>10</p>
                                                    <p style={{fontSize : 12,color : 'gray'}}>รับเคสทั้งหมด</p>
                                                </div>
                                                <div>
                                                    <p style={{fontSize : 20 ,fontWeight : 'bold',color : '#b25d03'}}>10</p>
                                                    <p style={{fontSize : 12,color : 'gray'}}>ส่งต่อเคสทั้งหมด</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </Grid2>
                    </Grid2>
                </Sheet>
            </Box>
        </Sheet>
    )
}