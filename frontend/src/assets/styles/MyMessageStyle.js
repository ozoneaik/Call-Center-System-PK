export const MyMessageSheet = {
    flex: 1,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingTop: 'var(--Header-height)',
    display: 'grid',
    gridTemplateColumns: '1fr',

    '@media (min-width: 600px)': {
        paddingTop: 0,
        gridTemplateColumns: 'minmax(min-content, min(30%, 400px)) 1fr',
    },
};

export const MyMessageChatPane = {
    position: {
        xs: 'fixed',
        sm: 'sticky',
    },
    transform: {
        xs: 'translateX(calc(100% * (var(--MessagesPane-slideIn, 0) - 1)))',
        sm: 'none',
    },
    transition: 'transform 0.4s, width 0.4s',
    zIndex: 100,
    width: '100%',
    top: 52,
}

export const MyMessageNewDm = {
    height: {
        xs: 'calc(100dvh - var(--Header-height))',
        md: '100dvh'
    },
    display: 'flex',
    flexDirection: 'column',
    padding : 2
}