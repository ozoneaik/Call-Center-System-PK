import { ChatPageStyle } from "../styles/ChatPageStyle.js";
import { Box, CircularProgress, Sheet, Table, Stack } from "@mui/joy";
import BreadcrumbsComponent from "../Components/Breadcrumbs.jsx";
import { useEffect, useState } from "react";
import { customersListApi } from "../Api/Customer.js";
import Avatar from "@mui/joy/Avatar";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import { convertFullDate, getRandomColor } from "../Components/Options.jsx";
import Button from "@mui/joy/Button";
import EditNoteIcon from "@mui/icons-material/EditNote";
import ModalDialog from "../Components/ModalDialog.jsx";
import { useMediaQuery } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";

const BreadcrumbsPath = [{ name: "จัดการลูกค้า" }, { name: "รายละเอียด" }];

export default function Customers() {
    const isMobile = useMediaQuery("(max-width:600px)");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const [customers, setCustomers] = useState([]);
    const [selected, setSelected] = useState({});
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // state สำหรับ pagination
    const [lastPage, setLastPage] = useState(1);
    const [to, setTo] = useState(0);
    const [total, setTotal] = useState(0);
    const [links, setLinks] = useState([]);

    useEffect(() => {
        getCustomers(page).finally(() => setLoading(false));
    }, [page]);

    const getCustomers = async (pageNumber = 1) => {
        setLoading(true);
        const { data, status } = await customersListApi(pageNumber);
        if (status === 200) {
            setCustomers(data.customers.data);
            setTo(data.customers.to);
            setLinks(data.customers.links);
            setTotal(data.customers.total);
            setLastPage(data.customers.last_page);
        }
    };

    const handleEditClick = async (customer) => {
        setSelected(customer);
        setOpen(true);
    };

    const refresh = () => {
        getCustomers(page).finally(() => setLoading(false));
    };

    return (
        <>
            {/* Modal */}
            {open && (
                <ModalDialog
                    open={open}
                    setOpen={setOpen}
                    event={"customer"}
                    selected={selected}
                    Refresh={refresh}
                />
            )}
            <Sheet sx={ChatPageStyle.Layout}>
                <Box component="main" sx={ChatPageStyle.MainContent}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <BreadcrumbsComponent list={BreadcrumbsPath} />
                    </Box>
                    <Box sx={ChatPageStyle.BoxTable}>
                        <Typography level="h2" component="h1">
                            จัดการลูกค้า
                        </Typography>
                    </Box>
                    <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
                        <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
                            <thead>
                                <tr>
                                    <th style={{ width: 80 }}>ลำดับ</th>
                                    <th style={{ width: 200 }}>ชื่อลูกค้า</th>
                                    <th style={{ width: 250 }}>คำอธิบาย</th>
                                    <th style={{ width: 200 }}>สร้างเมื่อ</th>
                                    <th style={{ width: 150 }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading ? (
                                    customers.length > 0 ? (
                                        customers.map((customer, index) => (
                                            <tr key={customer.id}>
                                                <td>{(page - 1) * 50 + index + 1}</td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center" }}>
                                                        <Avatar size="sm" sx={{ mr: 1 }} src={customer.avatar} />
                                                        <Typography>{customer.custName}</Typography>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Chip color={getRandomColor()}>
                                                        {customer.description}
                                                    </Chip>
                                                </td>
                                                <td>
                                                    <Chip color={getRandomColor()}>
                                                        {convertFullDate(customer.created_at)}
                                                    </Chip>
                                                </td>
                                                <td>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleEditClick(customer)}
                                                    >
                                                        <EditNoteIcon />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5}>ไม่มีข้อมูล</td>
                                        </tr>
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={5}>
                                            <CircularProgress />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Sheet>
                    {/* Pagination */}
                    <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                        <Stack
                            direction={isMobile ? "column-reverse" : "row"}
                            justifyContent={"space-between"}
                            alignItems={"center"}
                            spacing={2}
                            sx={{ width: "100%" }}
                        >
                            <Typography>{to} รายการ จากรายการทั้งหมด {total} รายการ</Typography>
                            <Stack direction="row" spacing={1}>
                                {links.map((link, index) => {
                                    const searchParams = link.url ? new URLSearchParams(link.url.split("?")[1]) : null;
                                    const pageNumber = searchParams ? searchParams.get("page") : null;

                                    return (
                                        <Button
                                            key={index}
                                            onClick={() => {
                                                pageNumber ? navigate(`/customers?page=${pageNumber}`) : null;
                                            }}
                                            variant={link.active ? "solid" : "soft"}
                                            color="primary"
                                            size="sm"
                                            disabled={!pageNumber} // disable ถ้าไม่มี page (เช่น ...)
                                        >
                                            {index === 0
                                                ? "ก่อนหน้า"
                                                : index === links.length - 1
                                                    ? "ถัดไป"
                                                    : link.label}
                                        </Button>
                                    );
                                })}
                            </Stack>
                        </Stack>
                    </Box>
                </Box>
            </Sheet>
        </>
    );
}
