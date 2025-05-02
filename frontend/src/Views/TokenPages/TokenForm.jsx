import React from 'react';
import { Box, Button, FormControl, FormLabel, Input, Option, Select, Stack } from '@mui/joy';
import { storeTokenApi, updateTokenApi } from "../../Api/Token.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";

export const TokenForm = (props) => {
    const { newToken, setNewToken, setTokens } = props;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newToken.id) {
            await handleUpdate(e, newToken.id);
        } else {
            await handleStore(e);
        }
    };

    const handleUpdate = async (e, id) => {
        e.preventDefault();
        const updatedData = {
            ...newToken,
            updated_at: new Date(),
        };
        const { data, status } = await updateTokenApi(updatedData);
        AlertDiaLog({
            title: data.message,
            text: data.detail,
            icon: status === 200 && 'success',
            onPassed: () => {
                if (status === 200) {
                    setTokens((prevState) =>
                        prevState.map((token) =>
                            token.id === id ? { ...token, ...updatedData } : token
                        )
                    );
                    setNewToken({});
                } else console.log('Failed to update');
            },
        });
    };

    const handleStore = async (e) => {
        e.preventDefault();
        const { data, status } = await storeTokenApi(newToken);
        AlertDiaLog({
            title: data.message,
            text: data.detail,
            icon: status === 200 && 'success',
            onPassed: () => {
                if (status === 200) {
                    const updatedToken = {
                        ...newToken,
                        id: data.Id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    };
                    setNewToken(updatedToken);
                    setTokens((prevState) => [...prevState, updatedToken]);
                    setNewToken({});
                } else console.log('status is not 200');
            }
        });
    };

    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setNewToken((prevState) => ({ ...prevState, [name]: value }));
    }

    const handleSelectPlatform = (e, newValue) => {
        setNewToken({ ...newToken, platform: newValue })
    }

    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <FormControl>
                    <FormLabel>Token</FormLabel>
                    <Input
                        name='accessToken' onChange={(e) => handleOnChange(e)}
                        placeholder="กรุณากรอก Token" value={newToken.accessToken || ''}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>คำอธิบาย</FormLabel>
                    <Input
                        name='description' onChange={(e) => handleOnChange(e)}
                        placeholder="กรุณากรอกคำอธิบาย" value={newToken.description || ''}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Platform</FormLabel>
                    <Select onChange={(e, newValue) => handleSelectPlatform(e, newValue)} defaultValue={newToken.platform}>
                        <Option value={'line'}>line</Option>
                        <Option value={'facebook'}>facebook</Option>
                        <Option value={'shopee'}>shopee</Option>
                        <Option value={'lazada'}>lazada</Option>
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                    <Button type="reset" color="neutral" onClick={() => setNewToken({})}>
                        ล้าง
                    </Button>
                    <Button type="submit" color="primary">
                        {newToken.id ? 'อัปเดต' : 'สร้าง'}
                    </Button>
                </Box>
            </Stack>
        </form>
    );
};