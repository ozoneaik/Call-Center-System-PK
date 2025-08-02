import { useState } from "react";
import {
    Button,
    Typography,
    Stack,
    Modal,
    ModalDialog
} from "@mui/joy";
import { Box } from "@mui/material";
import dayjs from 'dayjs';

export default function LegendToggle() {
    const [open, setOpen] = useState(false);

    const weekStart = dayjs().startOf('week').format('DD/MM/YYYY');
    const weekEnd = dayjs().endOf('week').format('DD/MM/YYYY');
    const monthStart = dayjs().startOf('month').format('DD/MM/YYYY');
    const monthEnd = dayjs().endOf('month').format('DD/MM/YYYY');

    return (
        <Box sx={{ mb: 2 }}>
            <Button
                size="sm"
                variant="outlined"
                onClick={() => setOpen(true)}
            >
                แสดงคำอธิบาย
            </Button>

            <Modal open={open} onClose={() => setOpen(false)}>
                <ModalDialog>
                    <Typography level="title-md" fontWeight="bold" gutterBottom>
                        คำอธิบาย:
                    </Typography>

                    <Stack direction="column" spacing={1}>
                        <Typography level="body-sm" sx={{ color: '#D32F2F', fontWeight: 'bold' }}>
                            ● สีแดง = ยังไม่มีการเคลื่อนไหวของเคส
                        </Typography>
                        <Typography level="body-sm" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                            ● สีเขียว = มีการเคลื่อนไหวของเคส
                        </Typography>
                        <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
                            ● <span style={{ color: '#2E7D32' }}>Active</span> = พนักงานมีการเคลื่อนไหวของเคสภายในวันนั้น เช่น มีเคสใหม่เข้ามา, ปิดเคส หรือมีการส่งต่อเคส
                        </Typography>
                        <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
                            ● <span style={{ color: '#9E9E9E' }}>Inactive</span> = พนักงานไม่มีการเคลื่อนไหวของเคสใดๆภายในวันนั้น
                        </Typography>
                    </Stack>

                    <Box display="flex" gap={2} mt={2}>
                        <Typography level="body-sm" color="neutral">
                            ปิดเคสสัปดาห์นี้: <strong>{weekStart} - {weekEnd}</strong>
                        </Typography>
                        <Typography level="body-sm" color="neutral">
                            ปิดเคสเดือนนี้: <strong>{monthStart} - {monthEnd}</strong>
                        </Typography>
                    </Box>

                    <Box mt={2} textAlign="right">
                        <Button size="sm" onClick={() => setOpen(false)}>
                            ปิด
                        </Button>
                    </Box>
                </ModalDialog>
            </Modal>
        </Box>
    );
}
