import {
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Divider
} from "@mui/joy";
import ResponsiveTable from "../ResponsiveTable";

export default function TagsMonthModal({ open, onClose, data, total, loading, range }) {
  const getModalStyles = () => ({
    width: '100%',
    maxWidth: {
      xs: '95vw',
      sm: '90vw',
      md: '720px',
      lg: '800px'
    },
    maxHeight: {
      xs: '90vh',
      sm: '85vh',
      md: '80vh'
    },
    margin: {
      xs: '1rem',
      sm: '2rem',
      md: 'auto'
    },
    overflow: 'auto'
  });

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={getModalStyles()}>
        <ModalClose />
        <Typography level="title-lg" mb={0.5}>
          แท็กของ "ปิดเคสในเดือนนี้"
        </Typography>
        <Typography
          level="body-sm"
          mb={1.5}
          sx={{
            color: "text.tertiary",
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {range.start} ถึง {range.end}
        </Typography>
        <Divider sx={{ mb: 1.5 }} />
        <ResponsiveTable
          data={data}
          totalCount={total}
          loading={loading}
          emptyMessage="ไม่มีข้อมูลแท็กในเดือนนี้"
        />
      </ModalDialog>
    </Modal>
  );
}
