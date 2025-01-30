export const MessageStyle = {
    MainLayout : {
        flex: 1,
        width: '100%',
        mx: 'auto',
        pt: {xs: 'var(--Header-height)', md: 0},
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
            // sm: 'minmax(min-content, min(80%, 800px)) 1fr',
            sm: '1fr',
            lg: 'minmax(min-content, min(70%, 1400px)) 1fr',
        },
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
        subLayout : {
            backgroundColor: 'background.body', borderLeft: '1px solid',
            borderColor: 'divider',
            position: {xs: 'fixed', sm: 'sticky'},
            transition: 'transform 0.4s, width 0.4s',
            zIndex: 100,
            width: '100%',
            transform: {xs: 'translateX(calc(100% * (var(--MessagesPane-slideIn, 0) - 1)))', sm: 'none',},
        },
        Box : {
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'background.body',
            height: '20%',
            // backgroundColor : 'red',
            backgroundImage: 'url(https://www.pumpkintool.com/wp-content/uploads/2017/11/Company-1.png)',
            objectFit: 'cover',
        }
    }
}