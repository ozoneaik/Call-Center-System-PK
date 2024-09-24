export const LoginStyle = {
    Layout: {
        width: {
            xs: '100%',
            md: '50vw'
        },
        transition: 'width var(--Transition-duration)',
        transitionDelay: 'calc(var(--Transition-duration) + 0.1s)',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255 255 255 / 0.2)',
    },
    ContentLeft: {
        display: 'flex', flexDirection: 'column', minHeight: '100dvh', width: '100%', px: 2,
    },
    Header: {
        py: 3,
        display: 'flex',
        justifyContent: 'space-between',
    },
    Title: {
        gap: 2,
        display: 'flex',
        alignItems: 'center'
    },
    ContentLeftMain: {
        my: 'auto',
        py: 2,
        pb: 5,
        display: 'flex',
        flexDirection: 'column',
        mx: 'auto',
        gap: 2,
        width: 400,
        maxWidth: '100%',
        borderRadius: 'sm',
        '& form': {
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
        },
        [`& .MuiFormLabel-asterisk`]: {
            visibility: 'hidden'
        },
    },
    ThemeLight : {
        color : {
            xs: '#FFF', md: 'text.tertiary'
        }
    },
    ContentRight : {
        height: '100%', position: 'fixed', right: 0, top: 0, bottom: 0, left: {xs: 0, md: '50vw'},
        transition:
            'background-image var(--Transition-duration), left var(--Transition-duration) !important',
        transitionDelay: 'calc(var(--Transition-duration) + 0.1s)',
        backgroundColor: 'background.level1', backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundImage:
            'url(https://www.pumpkintool.com/wp-content/uploads/2017/11/Company-1.png)',
    },
    ImageDark : {
        backgroundImage:
            'url(https://unforgettabletravel.com/wp-content/uploads/2021/07/Asiatique-the-Riverfront-market-Bangkok.jpg)',
    }
}