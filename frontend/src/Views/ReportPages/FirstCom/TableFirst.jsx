import { Button, Table, } from "@mui/joy";
import { rateListApi } from "../../../Api/Report";
import { AlertDiaLog } from "../../../Dialogs/Alert";
import { ChatPageStyle } from "../../../styles/ChatPageStyle";
export const TableFirst = ({ lineList, startTime, endTime ,setRateList,setActiveList}) => {
    const handleRateList = async (lineDescription) => {
        setRateList([]);
        setActiveList([]);
        const {data, status} = await rateListApi({startTime, endTime, lineDescription});
        console.log('rateList', data, status);
        if (status === 200) {
            setRateList(data.rateList);
        }else{
            AlertDiaLog({
                title : data.message,
                text : data.detail,
                onPassed : (confirm) => console.log(confirm)
            });
        }
    }
    return (
        <>
            <Table stickyHeader borderAxis="both" sx={ChatPageStyle.Table}>
                <thead>
                    <tr>
                        <th>จากไลน์</th>
                        <th>เคสที่จบแล้ว</th>
                        <th>เคสที่ค้าง</th>
                        <th>#</th>
                    </tr>
                </thead>
                <tbody>
                    {lineList.length > 0 && lineList.map((item, index) => (
                        <tr key={index}>
                            <td>{item.description}</td>
                            <td>{item.endcase}</td>
                            <td>{item.pendingcase}</td>
                            <td>
                                <Button size="sm" onClick={()=>handleRateList(item.description)} color="warning">ดูต่อ</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    )
}