import {ChatPageStyle} from "../../styles/ChatPageStyle.js";
import {Box, Sheet, Table} from "@mui/joy";
import BreadcrumbsComponent from "../../Components/Breadcrumbs.jsx";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import {useEffect, useState} from "react";
import {deleteTokenApi, tokenListApi} from "../../Api/Token.js";
import Chip from "@mui/joy/Chip";
import {convertFullDate} from "../../Components/Options.jsx";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CircularProgress from '@mui/joy/CircularProgress';
import {AlertDiaLog} from "../../Dialogs/Alert.js";
import {TokenForm} from "./TokenForm.jsx";


const BreadcrumbsPath = [{name: 'จัดการ Token'}, {name: 'รายละเอียด'}];

export default function AccessToken() {

    const [tokens, setTokens] = useState([{
        id: '',
        accessTokenId: '',
        accessToken: '',
        description: '',
        platform: '',
        created_at: '',
        updated_at: ''
    }]);

    const [newToken, setNewToken] = useState({
        id: '',
        accessTokenId: '',
        accessToken: '',
        description: '',
        platform: 'line',
        created_at: new Date(),
        updated_at: new Date()
    })
    const [loading, setLoading] = useState(false);
    const getTokens = async () => {
        setLoading(true);
        const {data, status} = await tokenListApi();
        status === 200 && setTokens(data.tokens);
    }
    useEffect(() => {
        getTokens().finally(() => setLoading(false));
    }, []);


    const handleEdit = (token) => {
        setNewToken({
            id: token.id,
            accessToken: token.accessToken,
            description: token.description,
            platform: token.platform,
            updated_at: new Date(),
        });
    };


    const handleDelete = (id) => {
        AlertDiaLog({
            icon: 'question',
            title: 'ยืนยันการลบ', text: 'กดตกลงเพื่อยืนยันการลบ', onPassed: async (confirm) => {
                if (confirm) {
                    const {data, status} = await deleteTokenApi(id);
                    AlertDiaLog({
                        title: data.message,
                        text: data.detail,
                        icon: status === 200 && 'success',
                        onPassed: async () => {
                            if (status === 200) {
                                const newTokens = tokens.filter((token) => token.id !== id);
                                setTokens(newTokens);
                            } else console.log(data.detail);
                        }
                    })
                } else console.log('ไม่ได้กดยืนยันการลบ')
            }
        });
    }


    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box component="main" sx={ChatPageStyle.MainContent}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <BreadcrumbsComponent list={BreadcrumbsPath}/>
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">จัดการ Token</Typography>
                </Box>
                <TokenForm newToken={newToken} setNewToken={setNewToken} setTokens={setTokens}/>
                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                    <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                        <thead>
                        <tr>
                            <th style={{width: 200}}>ไอดี</th>
                            <th style={{width: 200}}>token</th>
                            <th style={{width: 200}}>คำอธิบาย</th>
                            <th style={{width: 200}}>platform</th>
                            <th style={{width: 200}}>สร้างเมื่อ</th>
                            <th style={{width: 200}}>อัพเดทเมื่อ</th>
                            <th style={{width: 200}}>จัดการ</th>
                        </tr>
                        </thead>
                        <tbody>
                        {!loading ? (
                            tokens && tokens.length > 0 ? (
                                tokens.map((token, index) => (
                                    <tr key={index}>
                                        <td>{token.id}</td>
                                        <td>*****************</td>
                                        <td>{token.description}</td>
                                        <td>
                                            <Chip color={token.platform === 'line' ? 'success' : 'primary'}>
                                                {token.platform}
                                            </Chip>
                                        </td>
                                        <td>
                                            <Chip color='primary'>{convertFullDate(token.created_at)}</Chip>
                                        </td>
                                        <td>
                                            <Chip color='warning'>{convertFullDate(token.updated_at)}</Chip>
                                        </td>
                                        <td>
                                            <Box sx={{display: 'flex', gap: 1}}>
                                                <Button size='sm' color='warning' onClick={() => handleEdit(token)}>
                                                    <EditIcon/>
                                                </Button>
                                                <Button size='sm' color='danger' onClick={() => handleDelete(token.id)}>
                                                    <DeleteIcon/>
                                                </Button>
                                            </Box>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{textAlign: 'center'}}>
                                        <Chip color='danger'>ไม่มีข้อมูล</Chip>
                                    </td>
                                </tr>
                            )
                        ) : (
                            <tr>
                                <td colSpan={7} style={{textAlign: 'center'}}>
                                    <CircularProgress/>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </Table>
                </Sheet>
            </Box>
        </Sheet>
    )
}