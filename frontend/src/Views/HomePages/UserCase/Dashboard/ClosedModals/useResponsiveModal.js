import { useTheme, useMediaQuery } from '@mui/material';

export default function useResponsiveModal() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const modalSx = {
    width: isMobile ? "100vw" : 720,
    maxWidth: isMobile ? "100vw" : 960,
    maxHeight: isMobile ? "100vh" : "85vh",
    height: isMobile ? "100vh" : "auto",
    overflow: "auto",
    borderRadius: isMobile ? 0 : "12px",
    p: isMobile ? 1 : 2,
    boxShadow: "lg",
    bgcolor: "background.body",
  };

  return { modalSx }; // ✅ ต้องเป็น object ที่ return { modalSx }
}
