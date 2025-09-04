import React, { useEffect, useState } from 'react';
import {
    Box, Button, Card, CardContent, Container, Divider, Typography,
    FormControl, FormHelperText, FormLabel, Sheet, Textarea,
} from '@mui/joy';

import { Save } from '@mui/icons-material';
import axiosClient from '../Axios';
import { useParams } from 'react-router-dom';

export default function Feedback() {
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const { custId, rateId } = useParams();
    const [feedbackMessage, setFeedbackMessage] = useState({
        headerTitle: 'ขอบคุณสำหรับความคิดเห็นของคุณ!',
        color: 'success',
        description: 'เราได้รับข้อมูลของคุณเรียบร้อยแล้ว และจะนำไปพิจารณาเพื่อปรับปรุงบริการต่อไป'
    });

    useEffect(() => {
        fetchData().finally();
    }, [])

    const fetchData = async () => {
        try {
            const { data, status } = await axiosClient.get(`/feedback/${custId}/${rateId}`);
            console.log(data, status);
            if (data.status_feedback === 'submitted') {
                setSubmitted(true);
            }
        } catch (error) {
            setSubmitted(true);
            console.error(error.response.data.message, error.response.status);
            setFeedbackMessage({
                headerTitle: 'เกิดข้อผิดพลาด',
                description: error.response.data.message,
                color: 'danger'
            })
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!description.trim()) {
            setError('กรุณาใส่ข้อความ');
            return;
        }

        // Here you would typically send the data to your backend
        console.log('Feedback submitted:', { description });

        try {
            await axiosClient.post('/feedback', {
                rateId: rateId,
                feedback_description: description
            })

            setSubmitted(true);
            setError('');

        } catch (error) {
            setSubmitted(true);
            setFeedbackMessage({
                headerTitle: 'เกิดข้อผิดพลาด',
                description: error.response.data.message,
                color: 'danger'
            })
        }

    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Card
                variant="outlined"
                sx={{ boxShadow: 'md', borderRadius: 'lg', overflow: 'hidden', p: 0, gap: 0 }}
            >
                <Sheet
                    sx={{
                        bgcolor: '#af3700', py: 3, px: 4, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Typography level="h3" sx={{ mb: 1, color: 'white' }}>
                        บจก. พัมคิน คอร์ปอเรชั่น
                    </Typography>
                    <Typography level="body-md" textAlign="center" sx={{ color: 'white' }}>
                        📄ขอความร่วมมือในการแสดงความคิดเห็นเพื่อนำไปปรับปรุงบริการของเรา📄
                    </Typography>
                </Sheet>

                <Divider />

                <CardContent sx={{ p: 3 }}>
                    {submitted ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography level="h4" color={feedbackMessage.color} mb={2}>
                                {feedbackMessage.headerTitle}
                            </Typography>
                            <Typography level="body-md">
                                {feedbackMessage.description}
                            </Typography>
                        </Box>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <FormControl error={!!error} sx={{ mb: 3 }}>
                                <FormLabel>ข้อเสนอแนะ / ความคิดเห็น หรือสาเหตุท่านไม่ถูกใจบริการของเรา</FormLabel>
                                <Textarea
                                    placeholder="กรุณาแสดงความคิดเห็นของคุณที่นี่..." minRows={5} value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    sx={{ mt: 1, width: '100%', fontSize: '1rem', }}
                                />
                                {error && <FormHelperText>{error}</FormHelperText>}
                            </FormControl>

                            <Box sx={{
                                display: 'flex', gap: 2,
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'flex-end'
                            }}>
                                <Button type="submit" disabled={!description} startDecorator={<Save />}>
                                    ส่งข้อมูล
                                </Button>
                            </Box>
                        </form>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}