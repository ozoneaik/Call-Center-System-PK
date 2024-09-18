export const Main = {
    borderRight: '1px solid',
    borderColor: 'divider',
    overflowY: 'auto',
    height: {
        sm: 'calc(100dvh - var(--Header-height))',
        md: '100dvh'
    },
}

export const Head = {
    alignItems: 'center',
    justifyContent: 'space-between',
    p: 2,
    pb: 1.5
}

export const HeadTitle = {
    fontSize: {
        xs: 'md',
        md: 'lg'
    },
    fontWeight: 'lg',
    mr: 'auto'
}

export const ListStyle = {
    py: 0,
    '--ListItem-paddingY': '0.75rem',
    '--ListItem-paddingX': '1rem',
}

export const BoxStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
}