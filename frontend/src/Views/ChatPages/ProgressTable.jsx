import { ChatPageStyle } from "../../styles/ChatPageStyle.js";
import Typography from "@mui/joy/Typography";
import {
  Button,
  Divider,
  Input,
  Sheet,
  Stack,
  Table,
  Box,
  Chip,
  Avatar,
  Badge,
  Checkbox,
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
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { endTalkAllProgressApi } from "../../Api/Messages.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  AccessAlarm,
  DateRange,
  Search,
  History,
  Send,
  Chat,
  ExpandMore,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const IntroChat = ({ data }) => {
  const isLatestMessageFromCustomer = data.isUnread === true;

  return (
    <Stack direction="row" spacing={1} alignItems={"center"}>
      {isLatestMessageFromCustomer ? (
        <Badge
          color="success"
          variant="solid"
          size="md"
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          badgeInset="8%"
        >
          <Avatar size="md" sx={{ mr: 0 }} src={data.avatar || ""} />
        </Badge>
      ) : (
        <Avatar size="sm" sx={{ mr: 1 }} src={data.avatar || ""} />
      )}
      <Box>
        <Typography fontWeight="bold">
          {data.custName}
          &nbsp;
          <Typography fontSize={10} color="neutral">
            (รหัสอ้างอิง &nbsp;A{data.id}R{data.rateRef})
          </Typography>
        </Typography>
        <Chip color="success" size="sm">
          {data.description}
        </Chip>
        <Divider sx={{ my: 1 }} />
        <Chip
          color="primary"
          variant="soft"
          startDecorator={<Chat fontSize="large" />}
        >
          <MessageDetail data={data} />
        </Chip>
      </Box>
    </Stack>
  );
};

const MessageDetail = ({ data }) => {
  if (data.latest_message?.contentType) {
    if (data.latest_message.contentType === "text")
      return <>{data.latest_message.content}</>;
    else if (
      data.latest_message.contentType === "image" ||
      data.latest_message.contentType === "sticker"
    ) {
      return <>ส่งรูปภาพหรือสติกเกอร์</>;
    } else if (data.latest_message.contentType === "video") {
      return <>ส่งวิดีโอ</>;
    } else if (data.latest_message.contentType === "location") {
      return <>ส่งที่อยู่</>;
    } else if (data.latest_message.contentType === "audio") {
      return (
        <>
          ส่งไฟล์เสียง (เวลา {convertLocalDate(data.latest_message.created_at)})
        </>
      );
    } else if (data.latest_message.contentType === "file")
      return <>ส่งไฟล์ PDF</>;
    else return <></>;
  } else return <></>;
};

export const ProgressTable = ({
  roomId,
  progress,
  filterProgress,
  setFilterProgress,
  showMyCasesOnly,
  setShowMyCasesOnly,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isFilterExpanded, setIsFilterExpanded] = useState(!isMobile);

  useEffect(() => {
    setIsFilterExpanded(!isMobile);
  }, [isMobile]);

  const handleChat = (rateId, activeId, custId) => {
    setFilterProgress((prev) =>
      prev.map((item) =>
        item.custId === custId ? { ...item, isUnread: false } : item
      )
    );

    let unreadIds = JSON.parse(localStorage.getItem("unreadCustIds") || "[]");
    unreadIds = unreadIds.filter((id) => id !== custId);
    localStorage.setItem("unreadCustIds", JSON.stringify(unreadIds));

    const params = `${rateId}/${activeId}/${custId}`;
    navigate(`/select/message/${params}/1`, {
      state: { from: location },
    });
  };

  const TimeDisplay = ({ startTime }) => {
    const [timeDiff, setTimeDiff] = useState(() => differentDate(startTime));

    useEffect(() => {
      const interval = setInterval(() => {
        setTimeDiff(differentDate(startTime));
      }, 1000);
      return () => clearInterval(interval);
    }, [startTime]);

    return (
      <Chip color="primary" variant="solid" startDecorator={<AccessAlarm />}>
        <Typography sx={ChatPageStyle.TableText}>
          {startTime ? timeDiff : "ยังไม่เริ่มสนทนา"}
        </Typography>
      </Chip>
    );
  };

  const handleEndTalkAll = () => {
    AlertDiaLog({
      title: "จบการสนทนาทั้งหมด",
      text: "คุณต้องการจบการสนทนาทั้งหมดที่กำลังดำเนินการอยู่หรือไม่ ?",
      icon: "question",
      onPassed: async (confirm) => {
        if (confirm) {
          const { data, status } = await endTalkAllProgressApi({
            roomId,
            list: progress,
          });
          AlertDiaLog({
            title: data.message,
            text: data.detail,
            icon: status === 200 ? "success" : "error",
            onPassed: () => status === 200 && window.location.reload(),
          });
        }
      },
    });
  };

  const handleFilter = () => {
    if (!search) {
      setFilterProgress(progress);
      return;
    }
    const updateFilter = progress.filter((data) =>
      data.custName.toLowerCase().includes(search.toLowerCase())
    );
    setFilterProgress(updateFilter);
  };

  const handleMyCasesFilter = (checked) => {
    if (checked) {
      const myCases = progress.filter(
        (data) => data.empCode === user.empCode || data.empId === user.id
      );
      setFilterProgress(myCases);
    } else {
      setFilterProgress(progress);
    }
  };

  const handleCheckboxChange = (event) => {
    const isChecked = event.target.checked;
    setShowMyCasesOnly(isChecked);
    handleMyCasesFilter(isChecked);
  };

  return (
    <Stack>
      <AccordionGroup sx={{ mb: 2 }}>
        <Accordion
          expanded={isFilterExpanded}
          onChange={(event, expanded) => setIsFilterExpanded(expanded)}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography level="h2" component="h1">
              กำลังดำเนินการ&nbsp;
              <Typography level="body-sm" color="neutral">
                ({filterProgress.length} / {progress.length} รายการ)
              </Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ sm: "center" }}
              flexWrap="wrap"
            >
              <Input
                type="search"
                placeholder="ค้นหาชื่อลูกค้า"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                sx={{ flexGrow: 1, minWidth: "200px" }}
              />
              <Button onClick={handleFilter} startDecorator={<Search />}>
                ค้นหา
              </Button>
              <Button
                color="neutral"
                onClick={() => {
                  setSearch("");
                  setShowMyCasesOnly(false);
                  setFilterProgress(progress);
                }}
              >
                เคลียร์
              </Button>
              <Box sx={{ pt: { xs: 1, sm: 0 } }}>
                <Checkbox
                  label="แสดงเฉพาะเคสของตัวเอง"
                  checked={showMyCasesOnly}
                  onChange={handleCheckboxChange}
                />
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="flex-end"
            >
              {user.role === "admin" && (
                <Button
                  color="warning"
                  onClick={handleEndTalkAll}
                  startDecorator={<Send />}
                >
                  จบการสนทนาทั้งหมด
                </Button>
              )}
              <Button
                component={Link}
                to={"/chatHistory"}
                color="neutral"
                startDecorator={<History />}
              >
                ประวัติแชททั้งหมด
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </AccordionGroup>

      <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet}>
        <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
          <thead>
            <tr>
              <th style={{ width: 300 }}>ชื่อลูกค้า</th>
              <th style={{ width: 200 }}>พนักงานรับเรื่อง</th>
              <th style={{ width: 200 }}>วันที่รับเรื่อง</th>
              <th style={{ width: 200 }}>เวลาเรื่ม</th>
              <th style={{ width: 200 }}>เวลาที่สนทนา</th>
              <th style={{ width: 150 }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filterProgress && filterProgress.length > 0 ? (
              // ✅ ไม่ต้อง .sort() แล้ว เพราะข้อมูลถูกเรียงมาจาก Component แม่
              filterProgress.map((data, index) => (
                <tr key={index}>
                  <td style={{ overflow: "hidden" }}>
                    <IntroChat data={data} />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {data.empCode && (
                        <Avatar color="primary" size="sm" sx={{ mr: 1 }} />
                      )}
                      <Typography>{data.empName || "-"}</Typography>
                    </div>
                  </td>
                  <td>
                    <Chip
                      variant="solid"
                      color="success"
                      startDecorator={<DateRange />}
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
                      startDecorator={<DateRange />}
                    >
                      <Typography sx={ChatPageStyle.TableText}>
                        เวลาเรื่ม :{" "}
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
                      variant="outlined"
                      sx={{ mr: 1 }}
                      startDecorator={<Chat />}
                    >
                      <Typography>ดูข้อความ</Typography>
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  <Chip variant="solid" color="primary">
                    ไม่มีข้อมูล
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