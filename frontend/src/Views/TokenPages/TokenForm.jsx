import React from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Option,
  Select,
  Stack,
} from "@mui/joy";
import { storeTokenApi, updateTokenApi } from "../../Api/Token.js";
import { AlertDiaLog } from "../../Dialogs/Alert.js";
import FacebookLogo from "../../assets/facebookLogo.svg";
import LineLogo from "../../assets/LineLogo.svg";
import ShopeeLogo from "../../assets/ShopeeLogo.svg";
import LazadaLogo from "../../assets/LazadaLogo.svg";
import TiktokLogo from "../../assets/TikTok.svg";

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

  const handleStore = async (e) => {
    e.preventDefault();

    const { data, status } = await storeTokenApi(newToken);
    AlertDiaLog({
      title: data.message,
      text: data.detail,
      icon: status === 200 && "success",
      onPassed: () => {
        if (status === 200) {
          const updatedToken = {
            ...newToken,
            id: data.Id,
            created_at: new Date(),
            updated_at: new Date(),
          };
          setTokens((prevState) => [...prevState, updatedToken]);
          setNewToken({});
        } else {
          console.log("status is not 200");
        }
      },
    });
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
      icon: status === 200 && "success",
      onPassed: () => {
        if (status === 200) {
          setTokens((prevState) =>
            prevState.map((token) =>
              token.id === id ? { ...token, ...updatedData } : token
            )
          );
          setNewToken({});
        } else {
          console.log("Failed to update");
        }
      },
    });
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setNewToken((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSelectPlatform = (e, newValue) => {
    setNewToken({ platform: newValue }); // Reset fields on platform change
  };

  return (
    <form onSubmit={handleSubmit} >
      <Stack spacing={2}>
        <FormControl>
          <FormLabel>Platform</FormLabel>
          <Select
            onChange={handleSelectPlatform}
            value={newToken.platform || ""}
          >
            <Option value={"line"}>
              <img src={LineLogo} width={20} height={20} alt="Line" /> Line
            </Option>
            <Option value={"facebook"}>
              <img src={FacebookLogo} width={20} height={20} alt="Facebook" />{" "}
              Facebook
            </Option>
            <Option value={"shopee"}>
              <img src={ShopeeLogo} width={20} height={20} alt="Shopee" />{" "}
              Shopee
            </Option>
            <Option value={"lazada"}>
              <img src={LazadaLogo} width={20} height={20} alt="Lazada" />{" "}
              Lazada
            </Option>
            <Option value={"Tiktok"}>
              <img src={TiktokLogo} width={20} height={20} alt="TikTok" />{" "}
              Tiktok
            </Option>
          </Select>
        </FormControl>

        {newToken.platform && (
          <FormControl>
            <FormLabel>Token</FormLabel>
            <Input required
              name="accessToken"
              onChange={handleOnChange}
              placeholder="กรุณากรอก Token"
              value={newToken.accessToken || ""}
            />
          </FormControl>
        )}

        {newToken.platform === "facebook" && (
          <FormControl>
            <FormLabel>Page ID</FormLabel>
            <Input required
              name="fb_page_id"
              onChange={handleOnChange}
              placeholder="กรุณากรอก Page ID"
              value={newToken.fb_page_id || ""}
            />
          </FormControl>
        )}

        {newToken.platform === "lazada" && (
          <>
            <FormControl>
              <FormLabel>App Key</FormLabel>
              <Input required
                name="app_key"
                onChange={handleOnChange}
                placeholder="กรุณากรอก App Key"
                value={newToken.app_key || ""}
              />
            </FormControl>
            <FormControl>
              <FormLabel>App Secret</FormLabel>
              <Input required
                name="app_secret"
                onChange={handleOnChange}
                placeholder="กรุณากรอก App Secret"
                value={newToken.app_secret || ""}
              />
            </FormControl>
          </>
        )}

        {newToken.platform && (
          <FormControl>
            <FormLabel>คำอธิบาย</FormLabel>
            <Input required
              name="description"
              onChange={handleOnChange}
              placeholder="กรุณากรอกคำอธิบาย"
              value={newToken.description || ""}
            />
          </FormControl>
        )}

        <Box
          sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2 }}
        >
          <Button type="reset" color="neutral" onClick={() => setNewToken({})}>
            ล้าง
          </Button>
          <Button type="submit" color="primary">
            {newToken.id ? "อัปเดต" : "สร้าง"}
          </Button>
        </Box>
      </Stack>
    </form>
  );
};