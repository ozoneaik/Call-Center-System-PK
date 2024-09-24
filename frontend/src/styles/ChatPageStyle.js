export const ChatPageStyle = {
    Layout : {
        flex: 1,
        width: '100%',
        mx: 'auto',
        pt: { xs: 'var(--Header-height)', md: 0 },
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
        },
    },
    MainContent : {
        px: {xs: 2, md: 6},
        pb: {xs: 2, sm: 2, md: 3},
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100dvh',
        gap: 1,
    },
    BoxTable : {
        display: 'flex',
        mb: 1,
        gap: 1,
        flexDirection: {xs: 'column', sm: 'row'},
        alignItems: {xs: 'start', sm: 'center'},
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    BoxSheet: {
        display: {sm: 'initial'}, width: '100%',
        borderRadius: 'sm', flexShrink: 1, overflow: 'auto', minHeight: 0,
    },
    Table : {
        '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
        '--Table-headerUnderlineThickness': '1px',
        '--TableRow-hoverBackground': 'var(--joy-palette-background-level1)',
    },
    TableText : {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: {
            xs: '80px',   // สำหรับหน้าจอขนาดเล็ก
            sm: '100px',  // สำหรับหน้าจอขนาดเล็กขึ้นไป
            md: '150px',  // สำหรับหน้าจอกลางขึ้นไป
            lg: '200px',  // สำหรับหน้าจอขนาดใหญ่ขึ้นไป
            xl: '100%',   // สำหรับหน้าจอขนาดใหญ่มาก
        },
    }

}