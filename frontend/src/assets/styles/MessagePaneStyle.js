export const Main = {
    height: {
        xs: 'calc(100dvh - var(--Header-height))',
        md: '100dvh'
    },
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'background.level1',
}

export const Layout = {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    px: 2,
    py: 3,
    overflowY: 'scroll',
    flexDirection: 'column-reverse',
}

export const ContentIsYou = {
    flexDirection: 'row-reverse'
}
export const ContentIsNotYou = {
    flexDirection: 'row'
}


export const PaneHeader = {
    justifyContent: 'space-between',
    py: 2,
    px: {
        xs: 1,
        md: 2
    },
    borderBottom: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.body',
}

export const HeadTitle = {
    fontWeight: 'lg', fontSize: 'lg'
}


export const BackIcon = {
    display: {
        xs: 'inline-flex',
        sm: 'none'
    }
}

export const Description = {
    display: {
        xs: 'none',
        lg: 'block'
    },
}

export const ButtonTextShortCut = {
    display: {
        xs: 'none',
        lg: 'block'
    },
    fontSize: 14
}