import { Box, Sheet, Table, Typography } from "@mui/joy"
import { ChatPageStyle } from "../../styles/ChatPageStyle"
import BreadcrumbsComponent from "../../Components/Breadcrumbs"
import { Grid2 } from "@mui/material";
import { useEffect, useState } from "react";
import axiosClient from "../../Axios";


const BreadcrumbsPath = [{ name: 'แชทช่วยเหลือ' }, { name: 'รายการแชท' }];
function HelpChatList() {
    const [helpChatList, setHelpChatList] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetchHelpChatList().finally(() => setLoading(false));
    }, []);

    const fetchHelpChatList = async () => {
        try {
            setLoading(true);
            const { data, status } = await axiosClient.get('/help-chat/list');
            console.log(data, status);
            setHelpChatList(data.data)
        } catch (error) {
            console.error('Error fetching help chat list:', error);
        }
    }
    return (
        <Sheet sx={ChatPageStyle.Layout}>
            <Box sx={ChatPageStyle.MainContent}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BreadcrumbsComponent list={BreadcrumbsPath} />
                </Box>
                <Box sx={ChatPageStyle.BoxTable}>
                    <Typography level="h2" component="h1">จัดการลูกค้า</Typography>
                </Box>
                <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                    <Grid2 container spacing={2}>
                        <Grid2 size={12}>
                            <Table stickyHeader hoverRow sx={[ChatPageStyle.Table, {overflow: 'auto' }]}>
                                <thead>
                                    <tr>
                                        <th>id</th>
                                        <th style={{width : '500px'}}>search</th>
                                        <th style={{width : '200px'}}>problem</th>
                                        <th style={{width : '200px'}}>solve</th>
                                        <th>sku</th>
                                        <th>model</th>
                                        <th>remark</th>
                                        <th>search_vector</th>
                                        <th>skugroup</th>
                                        <th>cause</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!loading && helpChatList.data && helpChatList.data.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.id}</td>
                                            <td>{item.search}</td>
                                            <td>{item.problem}</td>
                                            <td>{item.solve}</td>
                                            <td>{item.sku}</td>
                                            <td>{item.model}</td>
                                            <td>{item.remark}</td>
                                            <td>{item.search_vector}</td>
                                            <td>{item.skugroup}</td>
                                            <td>{item.cause}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Grid2>
                    </Grid2>
                </Sheet>
            </Box>
        </Sheet>
    )
}

export default HelpChatList