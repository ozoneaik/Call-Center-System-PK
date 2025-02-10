import { Box, Button, IconButton, Stack, Typography } from "@mui/joy";

export const Pagination = ({ from = 1, last_page = 42, current_page = 1, onPageChange }) => {
  

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        overflowX: "scroll",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {[...Array(last_page)].map((page, index) =>
        page === "..." ? (
          <Typography key={index}>
            ...
          </Typography>
        ) : (
          <Button
            key={index}
            size="sm"
            variant={current_page === index+1 ? "solid" : "outlined"}
            color={current_page === index+1 ? "primary" : "neutral"}
            sx={{
              minWidth: 32,
              borderRadius: "md",
              fontWeight: current_page === page ? "bold" : "normal",
            }}
            onClick={() => onPageChange && onPageChange(index+1)}
          >
            {index+1}
          </Button>
        )
      )}
    </Stack>
  );
};
