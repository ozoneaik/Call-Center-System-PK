import { Card, CardContent, Typography } from "@mui/joy";

export default function InfoCard({ title, value, color, onClick }) {
  return (
    <Card
      variant="soft"
      onClick={onClick}
      sx={{
        minWidth: 200,
        backgroundColor: color + "22",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 120ms ease",
        "&:hover": onClick ? { transform: "translateY(-2px)" } : {},
      }}
    >
      <CardContent>
        <Typography level="title-md" fontWeight="lg">
          {title}
        </Typography>
        <Typography level="h3" fontWeight="xl">
          {value} เคส
        </Typography>
      </CardContent>
    </Card>
  );
}
