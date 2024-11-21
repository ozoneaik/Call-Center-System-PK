import { Button, Chip, Table } from "@mui/joy";
import { activeListApi } from "../../../Api/Report";
import { ChatPageStyle } from "../../../styles/ChatPageStyle";
export const RateList = ({ rateList, setActiveList }) => {
    const handleActiveList = async (rateId) => {
        const { data, status } = await activeListApi({ rateId });
        console.log('activeList', data, status);
        if (status === 200) {
            setActiveList({
                custName: data.custName,
                List: data.activeList,
                totalTimeInSeconds: data.totalTimeInSeconds,
                totalChat: data.totalChat
            })
        }
    }
    return (

        <Table stickyHeader borderAxis="both" sx={ChatPageStyle.Table}>
            <thead>
                <tr>
                    <th>ลูกค้า</th>
                    <th>สถานะ</th>
                    <th>แท็คการจบสนทนา</th>
                    <th>จำนวนดาว</th>
                    <th>#</th>
                </tr>
            </thead>
            <tbody>
                {rateList.length > 0 && rateList.map((item, index) => (
                    <tr key={index}>
                        <td>{item.custName}</td>
                        <td>
                            <Chip variant="solid" color={item.status === 'success' ? 'success' : item.status === 'progress' ? 'warning' : 'neutral'}>{item.status}</Chip>
                        </td>
                        <td>{item.t_menu}</td>
                        <td>
                            {
                                item.rate === 1 ? '⭐' :
                                    item.rate === 2 ? '⭐⭐' :
                                        item.rate === 3 ? '⭐⭐⭐' :
                                            item.rate === 4 ? '⭐⭐⭐⭐' :
                                                item.rate === 5 ? '⭐⭐⭐⭐⭐' : 'ยังไม่ได้ให้คะแนน'
                            }
                        </td>
                        <td>
                            <Button size="sm" onClick={() => handleActiveList(item.id)} color="warning">ดูต่อ</Button>
                        </td>
                    </tr>
                ))}

            </tbody>
        </Table>

    )
}