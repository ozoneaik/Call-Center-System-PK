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
  Badge
} from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle"; // Assuming this contains table styles
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { useEffect, useState } from "react";
import { myCaseApi } from "../../Api/Messages"; // Assuming myCaseApi fetches the data
import { convertFullDate } from "../../Components/Options"; // Assuming convertFullDate formats as D/M/YYYY HH:MM:SS
import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "../../context/NotiContext.jsx";

import ChatIcon from "@mui/icons-material/Chat";
import DateRangeIcon from "@mui/icons-material/DateRange"; // For calendar/date
import AccessTimeIcon from "@mui/icons-material/AccessTime"; // For clock/time
import SearchIcon from "@mui/icons-material/Search"; // For search time/duration

const TimeDisplay = ({ startTime }) => {
  const [duration, setDuration] = useState("ยังไม่เริ่มสนทนา");

  useEffect(() => {
    if (startTime) {
      const start = new Date(startTime);
      const updateDuration = () => {
        const now = new Date();
        const diffMs = now.getTime() - start.getTime(); 

        const seconds = Math.floor(diffMs / 1000) % 60;
        const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));

        let durationText = "";
        if (hours > 0) durationText += `${hours} ชั่วโมง `;
        if (minutes > 0) durationText += `${minutes} นาที `;
        durationText += `${seconds} วินาที`;

        const today = new Date();
        if (start.toDateString() === today.toDateString()) {
          durationText = `วันนี้เมื่อ ${durationText} ที่แล้ว`;
        } else {
          durationText = `${durationText} ที่แล้ว`;
        }

        setDuration(durationText.trim());
      };

      const interval = setInterval(updateDuration, 1000);
      updateDuration(); 

      return () => clearInterval(interval); 
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

const IntroChat = ({ data }) => (
  <Stack spacing={0.5}>
    <Stack direction="row" spacing={1} alignItems="center">
      {data.isUnread ? (
        <Badge
          color="success"
          variant="solid"
          size="md"
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          badgeInset="8%"
        >
          <Avatar
            color="primary"
            variant="solid"
            size="sm"
            src={data.avatar || ""}
          />
        </Badge>
      ) : (
        <Avatar
          color="primary"
          variant="solid"
          size="sm"
          src={data.avatar || ""}
        />
      )}

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
      ติดต่อมาจาก {data.source || "cal-center"}
    </Typography>

    <Chip
      variant="soft"
      color="neutral"
      size="sm"
      startDecorator={<ChatIcon sx={{ fontSize: "0.875rem" }} />}
      sx={{ alignSelf: "flex-start" }}
    >
      <Typography level="body-xs" noWrap maxWidth={250}>
        ข้อความล่าสุด: {data.latest_message?.content || "ไม่มีข้อความ"}
      </Typography>
    </Chip>
  </Stack>
);

const BreadcrumbsPath = [{ name: "เคสของฉัน" }, { name: "รายละเอียด" }];

export default function MyCasePage() {
  const { notification } = useNotification();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const filterProgress = list; 

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!notification || !notification.message) return;

    setList(prevList => {
      const updatedList = updateOrInsert(prevList, notification);
      return sortChatsByLatestMessage(updatedList);
    });
  }, [notification]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, status } = await myCaseApi();
      if (status === 200 && data.result) {
        const unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");

        let enrichedList = data.result.map(item => ({
          ...item,
          isUnread: unreadIds.includes(item.custId),
        }));

        enrichedList = sortChatsByLatestMessage(enrichedList);

        setList(enrichedList);
      } else {
        setList([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrInsert = (list, noti) => {
    const existsIndex = list.findIndex(item => item.custId === noti.Rate.custId);
    if (existsIndex >= 0) {
      const newList = [...list];
      newList[existsIndex] = {
        ...newList[existsIndex],
        latest_message: noti.message,
        isUnread: true,
      };
      return newList;
    }
    return [...list, {
      id: noti.activeConversation.id,
      custId: noti.customer.custId,
      custName: noti.customer.custName,
      avatar: noti.customer.avatar,
      rateRef: noti.Rate.id,
      latest_message: noti.message,
      isUnread: true,
    }];
  };

  const sortChatsByLatestMessage = (chats) => {
    return [...chats].sort((a, b) => {
      const aTime = new Date(a.latest_message?.created_at || 0).getTime();
      const bTime = new Date(b.latest_message?.created_at || 0).getTime();
      return bTime - aTime;
    });
  };

  const handleChat = (rateRef, id, custId) => {
    setList(prev =>
      prev.map(item =>
        item.custId === custId ? { ...item, isUnread: false } : item
      )
    );

    let unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");
    unreadIds = unreadIds.filter(uid => uid !== custId);
    localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));

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