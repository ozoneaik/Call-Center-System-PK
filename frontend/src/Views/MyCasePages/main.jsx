// import {
//   Box,
//   Button,
//   Sheet,
//   Typography,
//   Stack,
//   Avatar,
//   Chip,
//   CircularProgress,
//   Table,
// } from "@mui/joy";
// import { ChatPageStyle } from "../../styles/ChatPageStyle";
// import BreadcrumbsComponent from "../../Components/Breadcrumbs";
// import { useEffect, useState, memo } from "react";
// import { myCaseApi } from "../../Api/Messages";
// import { convertFullDate } from "../../Components/Options";
// import { useLocation, useNavigate } from "react-router-dom";
// import ChatIcon from "@mui/icons-material/Chat";
// import DateRangeIcon from "@mui/icons-material/DateRange";
// import AccessTimeIcon from "@mui/icons-material/AccessTime";
// import { useNotification } from "../../context/NotiContext";
// import { useAuth } from "../../context/AuthContext";

// const TimeDisplay = ({ startTime }) => {
//   const [duration, setDuration] = useState("ยังไม่เริ่มสนทนา");

//   useEffect(() => {
//     if (!startTime) {
//       setDuration("ยังไม่เริ่มสนทนา");
//       return;
//     }
//     const start = new Date(startTime);

//     const updateDuration = () => {
//       const now = new Date();
//       const diffMs = now.getTime() - start.getTime();

//       const seconds = Math.floor(diffMs / 1000) % 60;
//       const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
//       const hours = Math.floor(diffMs / (1000 * 60 * 60));

//       let durationText = "";
//       if (hours > 0) durationText += `${hours} ชั่วโมง `;
//       if (minutes > 0) durationText += `${minutes} นาที `;
//       durationText += `${seconds} วินาที`;

//       const today = new Date();
//       if (start.toDateString() === today.toDateString()) {
//         durationText = `วันนี้เมื่อ ${durationText} ที่แล้ว`;
//       } else {
//         durationText = `${durationText} ที่แล้ว`;
//       }

//       setDuration(durationText.trim());
//     };

//     const interval = setInterval(updateDuration, 1000);
//     updateDuration();
//     return () => clearInterval(interval);
//   }, [startTime]);

//   return (
//     <Chip variant="solid" color="info" startDecorator={<AccessTimeIcon />}>
//       <Typography sx={ChatPageStyle.TableText}>{duration}</Typography>
//     </Chip>
//   );
// };

// const IntroChat = memo(({ data }) => {
//   return (
//     <Stack spacing={0.5}>
//       <Stack direction="row" spacing={1} alignItems="center">
//         <Avatar
//           color="primary"
//           variant="solid"
//           size="sm"
//           src={data.avatar || ""}
//         />
//         <Stack>
//           <Typography level="body-sm" color="primary" fontWeight="bold">
//             {data.custName}
//           </Typography>
//           <Typography level="body-xs" textColor="text.tertiary">
//             (รหัสอ้างอิง A{data.id}R{data.rateRef})
//           </Typography>
//         </Stack>
//       </Stack>

//       <Typography level="body-xs" textColor="text.secondary">
//         ติดต่อมาจาก {data.source || "cal-center"}
//       </Typography>

//       <Chip
//         variant="soft"
//         color="neutral"
//         size="sm"
//         startDecorator={<ChatIcon sx={{ fontSize: "0.875rem" }} />}
//         sx={{ alignSelf: "flex-start" }}
//       >
//         <Typography level="body-xs" noWrap maxWidth={250}>
//           ข้อความล่าสุด: {data.latest_message?.content || "ไม่มีข้อความ"}
//         </Typography>
//       </Chip>
//     </Stack>
//   );
// });
// IntroChat.displayName = "IntroChat";

// const BreadcrumbsPath = [{ name: "เคสของฉัน" }, { name: "รายละเอียด" }];

// export default function MyCasePage() {
//   const [list, setList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { notification } = useNotification();
//   const { user } = useAuth();
//   const filterProgress = list;

//   useEffect(() => {
//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (!notification) return;
//     if (notification.message && notification.Rate?.status === "progress") {
//       if (notification.activeConversation?.empCode === user.empCode) {
//         setList((prev) => {
//           const index = prev.findIndex(
//             (item) => item.custId === notification.customer.custId
//           );
//           const sender = notification.message.sender || {};
//           const isCustomer = !!sender.custId;

//           if (index === -1) {
//             console.log(
//               "🟢 append เคสใหม่:",
//               notification.customer.custName,
//               "custId:",
//               notification.customer.custId
//             );
//             return [
//               ...prev,
//               {
//                 id: notification.activeConversation.id,
//                 custId: notification.customer.custId,
//                 custName: notification.customer.custName,
//                 avatar: notification.customer.avatar,
//                 description: notification.customer.description,
//                 empCode: notification.activeConversation.empCode,
//                 empName: notification.activeConversation.empName,
//                 rateRef: notification.Rate.id,
//                 receiveAt: notification.activeConversation.receiveAt,
//                 startTime: notification.activeConversation.startTime,
//                 latest_message: {
//                   content: notification.message.content,
//                   contentType: notification.message.contentType,
//                   sender,
//                   created_at: notification.message.created_at,
//                 },
//                 has_new_message: isCustomer,
//               },
//             ];
//           } else {
//             console.log(
//               "✏️ update แถวเดิม:",
//               prev[index].custName,
//               "custId:",
//               prev[index].custId,
//               "isCustomer?",
//               isCustomer
//             );
//             const newList = [...prev];
//             newList[index] = {
//               ...newList[index],
//               has_new_message: isCustomer,
//               latest_message: {
//                 content: notification.message.content,
//                 contentType: notification.message.contentType,
//                 sender,
//                 created_at: notification.message.created_at,
//               },
//             };
//             return newList;
//           }
//         });
//       } else {
//         console.log("⏩ ข้าม update เพราะไม่ใช่เคสของ user นี้");
//       }
//     }
//   }, [notification, user.empCode]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const { data, status } = await myCaseApi();
//       if (status === 200 && data.result) {
//         setList(data.result);
//       } else {
//         setList([]);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setList([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChat = (rateRef, id, custId) => {
//     localStorage.setItem("chat_update", Date.now());
//     const params = `/select/message/${rateRef}/${id}/${custId}/1`;
//     navigate(params, { state: { from: location } });
//   };

//   return (
//     <Sheet sx={ChatPageStyle.Layout}>
//       <Box sx={ChatPageStyle.MainContent}>
//         <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
//           <BreadcrumbsComponent list={BreadcrumbsPath} />
//         </Box>

//         <Button onClick={fetchData} sx={{ mb: 2 }}>
//           Refresh
//         </Button>

//         {loading ? (
//           <Box
//             sx={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               height: "200px",
//             }}
//           >
//             <CircularProgress />
//           </Box>
//         ) : (
//           <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet2}>
//             <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
//               <thead>
//                 <tr>
//                   <th style={{ width: 300 }}>ชื่อลูกค้า</th>
//                   <th style={{ width: 200 }}>พนักงานรับเรื่อง</th>
//                   <th style={{ width: 200 }}>วันที่รับเรื่อง</th>
//                   <th style={{ width: 200 }}>เวลาเริ่มต้น</th>
//                   <th style={{ width: 200 }}>เวลาที่สนทนา</th>
//                   <th style={{ width: 150 }}>จัดการ</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filterProgress && filterProgress.length > 0 ? (
//                   filterProgress.map((data, index) => (

//                     <tr key={index}>
//                       <td
//                         style={{
//                           overflow: "hidden",
//                           position: "relative",
//                           ...(data.has_new_message && {
//                             borderLeft: "4px solid #4caf50",
//                             paddingLeft: "12px",
//                           }),
//                         }}
//                       >
//                         <IntroChat data={data} />
//                       </td>
//                       <td>
//                         <div style={{ display: "flex", alignItems: "center" }}>
//                           {data.empCode && (
//                             <Avatar
//                               color="primary"
//                               size="sm"
//                               sx={{ mr: 1 }}
//                               src={data.empAvatar || ""}
//                             />
//                           )}
//                           <Typography>{data.empName || "-"}</Typography>
//                         </div>
//                       </td>
//                       <td>
//                         <Chip
//                           variant="solid"
//                           color="success"
//                           startDecorator={<DateRangeIcon />}
//                         >
//                           <Typography sx={ChatPageStyle.TableText}>
//                             {data.receiveAt
//                               ? convertFullDate(data.receiveAt)
//                               : "ยังไม่เริ่มสนทนา"}
//                           </Typography>
//                         </Chip>
//                       </td>
//                       <td>
//                         <Chip
//                           variant="solid"
//                           color="warning"
//                           startDecorator={<AccessTimeIcon />}
//                         >
//                           <Typography sx={ChatPageStyle.TableText}>
//                             {data.startTime
//                               ? convertFullDate(data.startTime)
//                               : "ยังไม่เริ่มสนทนา"}
//                           </Typography>
//                         </Chip>
//                       </td>
//                       <td>
//                         <TimeDisplay startTime={data.startTime} />
//                       </td>
//                       <td>
//                         <Button
//                           onClick={() =>
//                             handleChat(data.rateRef, data.id, data.custId)
//                           }
//                           size="sm"
//                           variant="soft"
//                           startDecorator={<ChatIcon />}
//                         >
//                           <Typography>ข้อความ</Typography>
//                         </Button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={6} style={{ textAlign: "center", padding: 20 }}>
//                       <Chip variant="solid" color="primary">
//                         ไม่มีข้อมูล
//                       </Chip>
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </Table>
//           </Sheet>
//         )}
//       </Box>
//     </Sheet>
//   );
// }

import {
  Box,
  Button,
  Sheet,
  Typography,
  Stack,
  Avatar,
  Chip,
  Table,
} from "@mui/joy";
import { ChatPageStyle } from "../../styles/ChatPageStyle";
import BreadcrumbsComponent from "../../Components/Breadcrumbs";
import { useEffect, useState, memo } from "react";
import { myCaseApi } from "../../Api/Messages";
import { convertFullDate } from "../../Components/Options";
import { useLocation, useNavigate } from "react-router-dom";
import ChatIcon from "@mui/icons-material/Chat";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useNotification } from "../../context/NotiContext";
import { useAuth } from "../../context/AuthContext";
import Skeleton from '@mui/joy/Skeleton'; // <-- นำเข้า Skeleton

const TimeDisplay = ({ startTime }) => {
  const [duration, setDuration] = useState("ยังไม่เริ่มสนทนา");

  useEffect(() => {
    if (!startTime) {
      setDuration("ยังไม่เริ่มสนทนา");
      return;
    }
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
  }, [startTime]);

  return (
    <Chip variant="solid" color="info" startDecorator={<AccessTimeIcon />}>
      <Typography sx={ChatPageStyle.TableText}>{duration}</Typography>
    </Chip>
  );
};

const IntroChat = memo(({ data }) => {
  return (
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
});
IntroChat.displayName = "IntroChat";

const BreadcrumbsPath = [{ name: "เคสของฉัน" }, { name: "รายละเอียด" }];

export default function MyCasePage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { notification } = useNotification();
  const { user } = useAuth();
  const filterProgress = list;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!notification) return;
    if (notification.message && notification.Rate?.status === "progress") {
      if (notification.activeConversation?.empCode === user.empCode) {
        setList((prev) => {
          const index = prev.findIndex(
            (item) => item.custId === notification.customer.custId
          );
          const sender = notification.message.sender || {};
          const isCustomer = !!sender.custId;

          if (index === -1) {
            console.log(
              "🟢 append เคสใหม่:",
              notification.customer.custName,
              "custId:",
              notification.customer.custId
            );
            return [
              ...prev,
              {
                id: notification.activeConversation.id,
                custId: notification.customer.custId,
                custName: notification.customer.custName,
                avatar: notification.customer.avatar,
                description: notification.customer.description,
                empCode: notification.activeConversation.empCode,
                empName: notification.activeConversation.empName,
                rateRef: notification.Rate.id,
                receiveAt: notification.activeConversation.receiveAt,
                startTime: notification.activeConversation.startTime,
                latest_message: {
                  content: notification.message.content,
                  contentType: notification.message.contentType,
                  sender,
                  created_at: notification.message.created_at,
                },
                has_new_message: isCustomer,
              },
            ];
          } else {
            console.log(
              "✏️ update แถวเดิม:",
              prev[index].custName,
              "custId:",
              prev[index].custId,
              "isCustomer?",
              isCustomer
            );
            const newList = [...prev];
            newList[index] = {
              ...newList[index],
              has_new_message: isCustomer,
              latest_message: {
                content: notification.message.content,
                contentType: notification.message.contentType,
                sender,
                created_at: notification.message.created_at,
              },
            };
            return newList;
          }
        });
      } else {
        console.log("⏩ ข้าม update เพราะไม่ใช่เคสของ user นี้");
      }
    }
  }, [notification, user.empCode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, status } = await myCaseApi();
      if (status === 200 && data.result) {
        setList(data.result);
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

  const handleChat = (rateRef, id, custId) => {
    localStorage.setItem("chat_update", Date.now());
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

        {/* นำเงื่อนไข loading ออกจากตรงนี้ เพื่อให้ตารางวาดขึ้นมาก่อนเสมอ */}
        <Sheet variant="outlined" sx={ChatPageStyle.BoxSheet2}>
          <Table stickyHeader hoverRow sx={ChatPageStyle.Table}>
            <thead>
              <tr>
                <th style={{ width: 300 }}>ชื่อลูกค้า</th>
                <th style={{ width: 200 }}>พนักงานรับเรื่อง</th>
                <th style={{ width: 200 }}>วันที่รับเรื่อง</th>
                <th style={{ width: 200 }}>เวลาเริ่มต้น</th>
                <th style={{ width: 200 }}>เวลาที่สนทนา</th>
                <th style={{ width: 150 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // --- แสดง Skeleton ระหว่างที่กำลังดึงข้อมูล API ---
                Array.from(new Array(5)).map((_, index) => (
                  <tr key={index}>
                    <td>
                      <Stack spacing={1} py={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Skeleton variant="circular" width={32} height={32} />
                          <Stack spacing={1}>
                            <Skeleton variant="text" width={120} />
                            <Skeleton variant="text" width={150} />
                          </Stack>
                        </Stack>
                        <Skeleton variant="text" width={180} />
                        <Skeleton variant="rectangular" width={220} height={24} sx={{ borderRadius: 'sm' }} />
                      </Stack>
                    </td>
                    <td>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="text" width={100} />
                      </Stack>
                    </td>
                    <td><Skeleton variant="rectangular" width={140} height={28} sx={{ borderRadius: 'sm' }} /></td>
                    <td><Skeleton variant="rectangular" width={140} height={28} sx={{ borderRadius: 'sm' }} /></td>
                    <td><Skeleton variant="rectangular" width={140} height={28} sx={{ borderRadius: 'sm' }} /></td>
                    <td><Skeleton variant="rectangular" width={90} height={32} sx={{ borderRadius: 'sm' }} /></td>
                  </tr>
                ))
              ) : filterProgress && filterProgress.length > 0 ? (
                filterProgress.map((data, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        overflow: "hidden",
                        position: "relative",
                        ...(data.has_new_message && {
                          borderLeft: "4px solid #4caf50",
                          paddingLeft: "12px",
                        }),
                      }}
                    >
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
                        )}
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
                        variant="soft"
                        startDecorator={<ChatIcon />}
                      >
                        <Typography>ข้อความ</Typography>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                // --- กรณีไม่มีข้อมูลลูกค้าเลย ---
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                    <Chip variant="soft" color="neutral" size="lg">
                      ยังไม่มีเคสของคุณในขณะนี้
                    </Chip>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Sheet>
      </Box>
    </Sheet>
  );
}
