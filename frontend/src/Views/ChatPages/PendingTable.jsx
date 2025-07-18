import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import {
  Button,
  Sheet,
  Table,
  Stack,
  Input,
  Chip,
  Typography,
  Box,
  Avatar,
  AccordionGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/joy";
import {
  convertFullDate,
  convertLocalDate,
  differentDate,
} from "../../Components/Options.jsx";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { receiveApi, receiveApiLazada } from "../../Api/Messages.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import ChatIcon from "@mui/icons-material/Chat";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import axiosClient from "../../Axios.js";

const LatestMessagePreview = ({ message }) => {
  if (!message || !message.contentType) return null;

  const time = `(เวลา ${convertLocalDate(message.created_at)})`;

  switch (message.contentType) {
    case "text":
      return (
        <>
          {message.content} {time}
        </>
      );
    case "image":
    case "sticker":
      return <>ส่งสื่อหรือสติกเกอร์ {time}</>;
    case "location":
      return <>ส่งที่อยู่ {time}</>;
    case "audio":
      return <>ส่งไฟล์เสียง {time}</>;
    case "file":
      return <>แนบไฟล์ PDF {time}</>;
    default:
      return null;
  }
};

const TimeDisplay = ({ startTime }) => {
  const [timeDiff, setTimeDiff] = useState(differentDate(startTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeDiff(differentDate(startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <Chip color="primary">
      <Typography sx={ChatPageStyle.TableText}>
        {startTime ? timeDiff : "N/A"}
      </Typography>
    </Chip>
  );
};

export const PendingTable = (props) => {
  const { pending, setFilterPending, filterPending, roomId } = props;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isFilterExpanded, setIsFilterExpanded] = useState(!isMobile);
  console.log("pending", pending);

  useEffect(() => {
    setIsFilterExpanded(!isMobile);
  }, [isMobile]);

  const handleReceiveChat = ({ rateId, id, custId, platform }) => {
    AlertDiaLog({
      title: "ต้องการรับเรื่องหรือไม่",
      text: 'กด "ตกลง" เพื่อยืนยันรับเรื่อง',
      icon: "info",
      onPassed: async (confirm) => {
        if (confirm) {
          if (platform === "lazada") {
            const { data, status } = await receiveApiLazada(rateId, roomId);
            if (status !== 200) {
              AlertDiaLog({
                title: data.message,
                text: data.detail,
                icon: "error",
              });
            }
          } else {
            const { data, status } = await receiveApi(rateId, roomId);
            if (status !== 200) {
              AlertDiaLog({
                title: data.message,
                text: data.detail,
                icon: "error",
              });
            }
            
          }
        }
      },
    });
  };

  const handleRedirectChat = (select) => {
    const params = `${select.rateRef}/${select.id}/${select.custId}`;
    navigate(`/select/message/${params}/0`, {
      state: { from: location },
    });
  };

  const handleFilter = () => {
    if (!search) {
      setFilterPending(pending);
      return;
    }
    const updateFilter = pending.filter((data) =>
      data.custName.toLowerCase().includes(search.toLowerCase())
    );
    setFilterPending(updateFilter);
  };

  const BtnReceiveComponent = ({ rateRef, id, custId, index, platform }) => {
    const isDisabled = user.role !== "admin" && index !== 0;
    return (
      <Button
        size="sm"
        variant="outlined"
        sx={{ mr: 1 }}
        disabled={isDisabled}
        startDecorator={<ChatIcon />}
        onClick={() =>
          handleReceiveChat({ rateId: rateRef, id, custId, platform })
        }
      >
        รับเรื่อง
      </Button>
    );
  };

  return (
    <Stack>
      <AccordionGroup sx={{ mb: 2 }}>
        <Accordion
          expanded={isFilterExpanded}
          onChange={(event, expanded) => setIsFilterExpanded(expanded)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography level="h2" component="h1">
              รอดำเนินการ&nbsp;
              <Typography level="body-sm" color="neutral">
                ({filterPending.length} / {pending.length} รายการ)
              </Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={1} alignItems="center">
              <Input
                fullWidth
                type="search"
                placeholder="ค้นหาชื่อลูกค้า"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={handleFilter} startDecorator={<SearchIcon />}>
                ค้นหา
              </Button>
              <Button
                color="neutral"
                onClick={() => {
                  setSearch("");
                  setFilterPending(pending);
                }}
              >
                เคลียร์
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </AccordionGroup>

      <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
        <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
          {/* ... table content remains the same ... */}
          <thead>
            <tr>
              <th style={{ width: 250 }}>ชื่อลูกค้า / ข้อความล่าสุด</th>
              <th style={{ width: 150 }}>เมื่อ</th>
              <th style={{ width: 150 }}>ผ่านมาแล้ว</th>
              <th style={{ width: 150 }}>จากห้องแชท</th>
              <th style={{ width: 150 }}>จากพนักงาน</th>
              <th style={{ width: 150 }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filterPending.length > 0 ? (
              filterPending.map((data, index) => (
                <tr key={index}>
                  <td>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar size="sm" src={data.avatar || ""} />
                      <Box>
                        <Typography fontWeight="md">{data.custName}</Typography>
                        <Chip color="success" size="sm">
                          {data.description}
                        </Chip>
                      </Box>
                    </Stack>
                    <Chip color="primary" variant="soft" sx={{ mt: 1, p: 1 }}>
                      <ChatIcon sx={{ fontSize: "1rem", mr: 0.5 }} />
                      <Typography level="body-xs">
                        <LatestMessagePreview message={data.latest_message} />
                      </Typography>
                    </Chip>
                  </td>
                  <td>
                    <Typography>{convertFullDate(data.updated_at)}</Typography>
                  </td>
                  <td>
                    <TimeDisplay startTime={data.created_at} />
                  </td>
                  <td>
                    <Chip color="warning" variant="soft">
                      {data.roomName || "ไม่พบ"}
                    </Chip>
                  </td>
                  <td>
                    <Chip color="primary" variant="soft">
                      {data.from_empCode || "ไม่พบ"}
                    </Chip>
                  </td>
                  <td>
                    <Box sx={{ display: "flex" }}>
                      <BtnReceiveComponent
                        index={index}
                        rateRef={data.rateRef}
                        id={data.id}
                        custId={data.custId}
                        platform={data.platform}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleRedirectChat(data)}
                      >
                        ดูข้อความ
                      </Button>
                    </Box>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  <Chip color="danger" variant="soft">
                    ไม่มีข้อมูลรอดำเนินการ
                  </Chip>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Sheet>
    </Stack>
  );
};
