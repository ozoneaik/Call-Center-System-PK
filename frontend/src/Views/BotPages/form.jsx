import Input from "@mui/joy/Input";
import Grid from "@mui/material/Grid2";
import Button from "@mui/joy/Button";
import {Autocomplete} from "@mui/joy";
import {addBotApi, updateBotApi} from "../../Api/BotMenu.js";
import {AlertDiaLog} from "../../Dialogs/Alert.js";

export const FormCreateOrUpdateBot = (props) => {
    const {setBots, setSelected, selected, chatRooms} = props;

    const handleChange = (field, value) => {
        setSelected((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAutocompleteChange = (event, newValue) => {
        if (newValue) {
            setSelected((prev) => ({
                ...prev,
                roomId: newValue.roomId,
                roomName: newValue.roomName,
            }));
        }
        console.log(newValue);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        AlertDiaLog({
            icon: 'question',
            title: 'ยืนยัน',
            text: 'กดตกลงเพื่อยืนยันการสร้าง/อัพเดทข้อมูล',
            onPassed: async (confirm) => {
                if (confirm) {
                    let data, status;
                    if (selected.id) {
                        ({data, status} = await updateBotApi({id: selected.id, bot: selected}));
                        setBots((prevBots) =>
                            prevBots.map((bot) =>
                                bot.id === selected.id ? {...bot, ...data.botMenu, roomName: selected.roomName} : bot
                            )
                        );
                        setSelected(null);
                    } else {
                        ({data, status} = await addBotApi({bot: selected}));
                        if (status === 200) {
                            setBots((prevBots) => [...prevBots, {...data.botMenu, roomName: selected.roomName}]);
                        }
                        setSelected(null);
                    }
                    AlertDiaLog({
                        icon: status === 200 && 'success',
                        title: data.message,
                        text: data.detail,
                        onPassed: () => console.log(data.message)
                    })
                } else console.log('ยกเลิกการสร้าง/อัพเดท')
            }
        })

    }

    return (
        <>
            <form onSubmit={(e) => handleSubmit(e)}>
                <Grid container spacing={2}>
                    <Grid size={{xs: 12, md: 4}}>
                        <Input
                            placeholder="ชื่อเมนู" value={selected?.menuName || ""}
                            onChange={(e) => handleChange("menuName", e.target.value)}
                        />
                    </Grid>
                    <Grid size={{xs: 12, md: 4}}>
                        <Autocomplete
                            options={chatRooms}
                            getOptionLabel={(option) => option.roomName}
                            onChange={handleAutocompleteChange}
                            value={chatRooms.find((room) => room.roomId === selected?.roomId) || null}
                            renderInput={(params) => (
                                <Input {...params} placeholder="เลือกห้อง"/>
                            )}
                        />
                    </Grid>
                    <Grid size={{xs: 12, md: 4}}>
                        <Button type='submit' sx={{mr: 1}}>
                            {selected ? selected.id ? "อัพเดท" : "สร้าง" : "สร้าง"}
                        </Button>
                        <Button color="warning" type="reset" onClick={() => setSelected(null)}>ล้าง</Button>
                    </Grid>
                </Grid>
            </form>
        </>
    );
};
