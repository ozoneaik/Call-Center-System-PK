export const MessageStyle = {
    MainLayout : {
        flex: 1,
        width: '100%',
        mx: 'auto',
        pt: {xs: 'var(--Header-height)', md: 0},
        display: 'grid',
        gridTemplateColumns: {
            // มือถือ: คอลัมน์เดียว โน้ต/AI/rail จะลอยทับแบบ fixed แทนการกินพื้นที่ grid
            xs: 'minmax(min-content, 1fr)',
            md: 'minmax(min-content, 1fr) var(--InfoPanel-width, 0px) var(--InfoRail-width, 84px)',
        },
        transition: 'grid-template-columns 0.25s ease',
    },
    Layout: {
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.level1',
    },
    PaneHeader: {
        Stack: {
            justifyContent: 'space-between',
            py: {
                xs: 2,
                md: 2
            },
            px: {
                xs: 1,
                md: 2
            },
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.body',
        },
        HeadTitle: {
            fontWeight: 'lg',
            fontSize: 'lg'
        },
        BtnText : {
            display: {
                xs: 'none',
                sm: 'none',
                md : 'block',
                lg: 'block'
            },
        }
    },
    PaneContent: {
        display: 'flex',
        flex: 1,
        minHeight: 0,
        px: 2,
        py: 3,
        overflowY: 'scroll',
        flexDirection: 'column-reverse',
    },
    TextArea: {
        justifyContent: 'end',
        alignItems: 'center',
        flexGrow: 1,
        p: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
    },
    Bubble: {
        Main: {
            justifyContent: 'space-between',
            mb: 0.25
        },
        IsMySent: {
            p: 1.25, borderRadius: 'lg',
            mr : 1,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 'lg',
            backgroundColor: 'var(--joy-palette-primary-solidBg)'
            // backgroundColor: '#d1dcf5',
        },
        IsSent: {
            p: 1.25, borderRadius: 'lg',
            mr : 1,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 'lg',
            // backgroundColor: 'var(--joy-palette-primary-solidBg)'
            backgroundColor: '#d1dcf5',
        },
        IsNotSent: {
            p: 1.25, borderRadius: 'lg',
            borderTopRightRadius: 'lg',
            borderTopLeftRadius: 0,
            backgroundColor: 'background.body'
        },
        ImageIsSent: {
            px: 1.75, py: 1.25, borderRadius: 'lg',
            borderTopRightRadius: 0,
            borderTopLeftRadius: 'lg'
        },
        ImageIsNotSent: {
            px: 1.75, py: 1.25, borderRadius: 'lg',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 'lg'
        },
        TextIsSent: {
            color: '#393b3d',
        },
        TextMySent: {
            color: '#ffffff',

        },
        TextIsNotSent: {
            color: 'var(--joy-palette-text-primary)'
        },
        ActionButtons: {
            position: 'absolute',
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 'md',
            boxShadow: 'sm',
            transition: 'opacity 0.2s',
            zIndex: 10,
            padding: '2px',
        }
    },
    imagePreview : {
        width: '100%', height: 'auto', borderRadius: '8px'
    },
    InsertImage : {
        mr: 1, color: 'white', display: {xs: 'none', sm: 'block'}
    },
    BtnCloseImage : {
        position: 'absolute',
        top: 8, right: 8,
        minWidth: 'auto',
        p: 0.5,
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.7)',
        },
    },
    Info : {
        rail : {
            // มือถือ: ลอยเป็น pill fixed ริมขวา / จอใหญ่: เป็นคอลัมน์ใน grid สูงเต็มจอ
            position: { xs: 'fixed', md: 'static' },
            top: { xs: '50%', md: 'auto' },
            right: { xs: 0, md: 'auto' },
            transform: { xs: 'translateY(-50%)', md: 'none' },
            zIndex: { xs: 120, md: 1 },
            maxHeight: { xs: '80dvh', md: 'none' },
            height: { xs: 'auto', md: '100%' },
            width: { xs: 'auto', md: '100%' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            py: { xs: 1, md: 2 },
            px: 0.5,
            overflowY: { xs: 'auto', md: 'hidden' },
            overflowX: 'hidden',
            border: { xs: '1px solid', md: 'none' },
            borderLeft: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.body',
            borderRadius: { xs: 'lg', md: 0 },
            boxShadow: { xs: 'md', md: 'none' },
        },
        railItem: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            width: '100%',
            py: 0.5,
            borderRadius: 'md',
            cursor: 'pointer',
        },
        railLabel: {
            fontSize: '11px',
            lineHeight: 1.1,
            textAlign: 'center',
            whiteSpace: 'nowrap',
        },
        aiIconButton: {
            backgroundColor: '#6c5dd3',
            color: '#fff',
            '&:hover': {
                backgroundColor: '#5b4bc4',
            },
        },
        collapsedRail: {
            position: { xs: 'fixed', md: 'static' },
            top: { xs: '50%', md: 'auto' },
            right: 0,
            transform: { xs: 'translateY(-50%)', md: 'none' },
            zIndex: { xs: 120, md: 1 },
            height: { xs: 40, md: '100%' },
            width: { xs: 22, md: '100%' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            cursor: 'pointer',
            border: { xs: '1px solid', md: 'none' },
            borderLeft: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.body',
            borderTopLeftRadius: { xs: 'md', md: 0 },
            borderBottomLeftRadius: { xs: 'md', md: 0 },
            boxShadow: { xs: 'sm', md: 'none' },
        },
        panelWrapper: {
            height: { xs: 'auto', md: '100%' },
            width: { xs: 'auto', md: '100%' },
            overflow: 'hidden',
        },
        panel: {
            // มือถือ: เปิดแบบเต็มจอทับห้องแชท / จอใหญ่: เป็นคอลัมน์ข้างๆ
            position: { xs: 'fixed', md: 'static' },
            inset: { xs: 0, md: 'auto' },
            zIndex: { xs: 110, md: 1 },
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: { xs: 'none', md: '1px solid' },
            borderColor: 'divider',
            backgroundColor: 'background.body',
        },
        panelHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
        },
        aiSummaryCard: {
            p: 1.5,
            borderRadius: 'md',
        },
        aiCard: {
            p: 1.5,
            borderRadius: 'md',
            backgroundColor: 'background.body',
        },
        aiQuestionBox: {
            p: 1,
            mb: 1,
            borderRadius: 'sm',
            backgroundColor: 'background.level1',
            borderLeft: '3px solid',
            borderColor: 'primary.400',
        },
        aiDraftBox: {
            p: 1.5,
            borderRadius: 'md',
            backgroundColor: '#2f6fed',
        },
        Box : {
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'background.body',
            height: '15%',
            // backgroundColor : 'red',
            backgroundImage: 'url(https://www.pumpkintool.com/wp-content/uploads/2017/11/Company-1.png)',
            // backgroundColor : '#f0f4f8',
            objectFit: 'cover',
        }
    }
}