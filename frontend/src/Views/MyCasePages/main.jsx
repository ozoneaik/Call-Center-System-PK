import {
  Box,
  Button,
  Sheet,
  Typography,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  Table,
} from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle"; // Assuming this contains table styles
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { useEffect, useState } from "react";
import { myCaseApi } from "../../Api/Messages"; // Assuming myCaseApi fetches the data
import { convertFullDate } from "../../Components/Options"; // Assuming convertFullDate formats as D/M/YYYY HH:MM:SS
import { useLocation, useNavigate } from "react-router-dom";

// Import specific Material-UI Icons
import ChatIcon from "@mui/icons-material/Chat";
import DateRangeIcon from "@mui/icons-material/DateRange"; // For calendar/date
import AccessTimeIcon from "@mui/icons-material/AccessTime"; // For clock/time
import SearchIcon from "@mui/icons-material/Search"; // For search time/duration

// Helper component for displaying the "เวลาที่สนทนา" (Chat Duration)
// This component needs to calculate the elapsed time from a given startTime.
const TimeDisplay = ({ startTime }) => {
  const [duration, setDuration] = useState("ยังไม่เริ่มสนทนา");

  useEffect(() => {
    if (startTime) {
      const start = new Date(startTime);
      const updateDuration = () => {
        const now = new Date();
        const diffMs = now.getTime() - start.getTime(); // Difference in milliseconds

        const seconds = Math.floor(diffMs / 1000) % 60;
        const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));

        let durationText = "";
        if (hours > 0) durationText += `${hours} ชั่วโมง `;
        if (minutes > 0) durationText += `${minutes} นาที `;
        durationText += `${seconds} วินาที`;

        // Add "วันนี้เมื่อ" if it's today's conversation
        const today = new Date();
        if (start.toDateString() === today.toDateString()) {
          durationText = `วันนี้เมื่อ ${durationText} ที่แล้ว`;
        } else {
          // For longer durations or past dates, you might want a different format
          durationText = `${durationText} ที่แล้ว`;
        }

        setDuration(durationText.trim());
      };

      // Update every second for real-time duration
      const interval = setInterval(updateDuration, 1000);
      updateDuration(); // Initial call

      return () => clearInterval(interval); // Cleanup on unmount
    } else {
      setDuration("ยังไม่เริ่มสนทนา");
    }
  }, [startTime]);

  return (
    <Chip variant="solid" color="info" startDecorator={<AccessTimeIcon />}>
      <Typography sx={ChatPageStyle.TableText}>{duration}</Typography>
    </Chip>
  );
};

// Assuming IntroChat component looks something like this (adapted from previous solution)
const IntroChat = ({ data }) => (
  <Stack spacing={0.5}>
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar
        color="primary"
        variant="solid"
        size="sm"
        src={data.avatar || ""}
      />
      <Stack>
        <Typography level="body-sm" color="primary" fontWeight="bold">
          {data.custName}
        </Typography>
        <Typography level="body-xs" textColor="text.tertiary">
          (รหัสอ้างอิง A{data.id}R{data.rateRef})
        </Typography>
      </Stack>
    </Stack>
    <Typography level="body-xs" textColor="text.secondary">
      ติดต่อมาจาก {data.source || "cal-center"}{" "}
      {/* Assuming data.source for "ติดต่อมาจาก cal-center" */}
    </Typography>
    <Chip
      variant="soft"
      color="neutral"
      size="sm"
      startDecorator={<ChatIcon sx={{ fontSize: "0.875rem" }} />}
      sx={{ alignSelf: "flex-start" }} // Align chip to start within the stack
    >
      <Typography level="body-xs" noWrap maxWidth={250}>
        ข้อความล่าสุด: {data.latest_message?.content || "ไม่มีข้อความ"}
      </Typography>
    </Chip>
  </Stack>
);

const BreadcrumbsPath = [{ name: "เคสของฉัน" }, { name: "รายละเอียด" }];

export default function MyCasePage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Use a different state name for filtered data if `filterProgress` is a derived state
  // For this example, I'll directly use `list` from `myCaseApi` as `filterProgress`
  // If you have a separate filtering logic, keep `filterProgress`
  const filterProgress = list; // Assuming 'list' from API is what you want to display

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, status } = await myCaseApi();
      console.log(data);
      if (status === 200 && data.result) {
        setList(data.result);
      } else {
        setList([]); // Ensure list is empty on error or no results
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setList([]); // Set list to empty on error
    } finally {
      setLoading(false);
    }
  };

  const handleChat = (rateRef, id, custId) => {
    const params = `/select/message/${rateRef}/${id}/${custId}/1`;
    navigate(params, { state: { from: location } });
  };

  return (
    <Sheet sx={ChatPageStyle.Layout}>
      <Box sx={ChatPageStyle.MainContent}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <BreadcrumbsComponent list={BreadcrumbsPath} />
        </Box>

        <Button onClick={fetchData} sx={{ mb: 2 }}>
          Refresh
        </Button>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet2}>
            <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
              <thead>
                <tr>
                  <th style={{ width: 300 }}>ชื่อลูกค้า</th>
                  <th style={{ width: 200 }}>พนักงานรับเรื่อง</th>
                  <th style={{ width: 200 }}>วันที่รับเรื่อง</th>
                  <th style={{ width: 200 }}>เวลาเริ่มต้น</th>{" "}
                  {/* Corrected header text */}
                  <th style={{ width: 200 }}>เวลาที่สนทนา</th>
                  <th style={{ width: 150 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filterProgress && filterProgress.length > 0 ? (
                  filterProgress.map((data, index) => (
                    <tr key={index}>
                      <td style={{ overflow: "hidden" }}>
                        <IntroChat data={data} />
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {data.empCode && (
                            <Avatar
                              color="primary"
                              size="sm"
                              sx={{ mr: 1 }}
                              src={data.empAvatar || ""}
                            />
                          )}{" "}
                          {/* Added src for avatar */}
                          <Typography>{data.empName || "-"}</Typography>
                        </div>
                      </td>
                      <td>
                        <Chip
                          variant="solid"
                          color="success"
                          startDecorator={<DateRangeIcon />}
                        >
                          <Typography sx={ChatPageStyle.TableText}>
                            {data.receiveAt
                              ? convertFullDate(data.receiveAt)
                              : "ยังไม่เริ่มสนทนา"}
                          </Typography>
                        </Chip>
                      </td>
                      <td>
                        <Chip
                          variant="solid"
                          color="warning"
                          startDecorator={<AccessTimeIcon />}
                        >
                          {" "}
                          {/* Changed to AccessTimeIcon */}
                          <Typography sx={ChatPageStyle.TableText}>
                            {data.startTime
                              ? convertFullDate(data.startTime)
                              : "ยังไม่เริ่มสนทนา"}
                          </Typography>
                        </Chip>
                      </td>
                      <td>
                        <TimeDisplay startTime={data.startTime} />
                      </td>
                      <td>
                        <Button
                          onClick={() =>
                            handleChat(data.rateRef, data.id, data.custId)
                          }
                          size="sm"
                          variant="soft" // Changed to 'soft' for a lighter look, like the image
                          startDecorator={<ChatIcon />}
                        >
                          <Typography>ข้อความ</Typography>{" "}
                          {/* Changed to "ข้อความ" as in the image */}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      <Chip variant="solid" color="primary">
                        ไม่มีข้อมูล
                      </Chip>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Sheet>
        )}
      </Box>
    </Sheet>
  );
}
