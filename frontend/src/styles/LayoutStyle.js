export const LayoutStyle = {
    MainLayout: {
        display: 'flex',
        minHeight: '100dvh',
    },
    Sidebar: {
        ToggleOpen: {
            display: 'grid',
            transition: '0.2s ease',
            '& > *': {
                overflow: 'hidden',
            },
            gridTemplateRows: '1fr'
        },
        ToggleClose: {
            display: 'grid',
            transition: '0.2s ease',
            '& > *': {
                overflow: 'hidden',
            },
            gridTemplateRows: '0fr'
        },
        Layout: {
            position: { xs: 'fixed', md: 'sticky' },
            transform: {
                xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))',
                md: 'none',
            },
            transition: 'transform 0.4s, width 0.4s',
            zIndex: 100,
            height: '100dvh',
            width: 'var(--Sidebar-width)',
            top: 0,
            p: 2,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            borderRight: '1px solid',
            borderColor: 'divider',
            // Dark background styling
            // backgroundColor: 'neutral.700',
            backgroundColor: '#363d42',
            color: '#ffffff',
            '& .MuiTypography-root': {
                // color: '#363d42',
                color: '#ccc'
            },
            '& .MuiListItemButton-root': {
                color: '#ffffff',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&.Mui-selected': {
                    backgroundColor: 'rgba(241, 87, 33, 0.2)',
                    // backgroundColor: '#c05e40',
                    color: '#fff',
                    '&:hover': {
                        backgroundColor: 'rgba(241, 87, 33, 0.3)',
                    },
                },
            },
            '& .MuiSvgIcon-root': {
                // color: '#363d42',
                color: '#ccc',
            },
            '& .MuiListItemButton-root.Mui-selected .MuiSvgIcon-root': {
                color: '#fff',
            },
            '& .MuiDivider-root': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '& .MuiAvatar-root': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
            },
        },
        Overlay: {
            position: 'fixed',
            zIndex: 98,
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            opacity: 'var(--SideNavigation-slideIn)',
            backgroundColor: 'var(--joy-palette-background-backdrop)',
            transition: 'opacity 0.4s',
            transform: {
                xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1) + var(--SideNavigation-slideIn, 0) * var(--Sidebar-width, 0px)))',
                lg: 'translateX(-100%)',
            },
        },
        ListItemButton: {
            minHeight: 0,
            overflow: 'hidden auto',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            '&::-webkit-scrollbar': {
                width: '0px',
            },
            '&:hover::-webkit-scrollbar': {
                width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#555',
                borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#ff7922',
            },
            '&::-webkit-scrollbar-track': {
                background: 'none',
            },
        },
        List: {
            gap: 1,
            '--List-nestedInsetStart': '30px',
            '--ListItem-radius': (theme) => theme.vars.radius.sm,
        },
        ListButton: {
            mt: 'auto',
            flexGrow: 0,
            '--ListItem-radius': (theme) => theme.vars.radius.sm,
            '--List-gap': '8px'
        }
    },
    Navbar: {
        display: { sm: 'flex', md: 'none' },
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        width: '100vw',
        height: 'var(--Header-height)',
        zIndex: 95,
        p: 2,
        gap: 1,
        borderBottom: '1px solid',
        borderColor: 'background.level1',
        boxShadow: 'sm',
    }
}