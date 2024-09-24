export const MessageStyle = {
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
        justifyContent: 'space-between',
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
        IsSent: {
            p: 1.25, borderRadius: 'lg',
            mr : 1,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 'lg',
            backgroundColor: 'var(--joy-palette-primary-solidBg)'
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
            color: 'var(--joy-palette-common-white)',
        },

        TextIsNotSent: {
            color: 'var(--joy-palette-text-primary)'
        }
    }
}