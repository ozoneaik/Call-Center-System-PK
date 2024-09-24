export const LayoutStyle = {
    MainLayout : {
        display : 'flex',
        minHeight : '100dvh',
    },
    Sidebar : {
        ToggleOpen : {
            display: 'grid',
            transition: '0.2s ease',
            '& > *': {
                overflow: 'hidden',
            },
            gridTemplateRows: '1fr'
        },
        ToggleClose : {
            display: 'grid',
            transition: '0.2s ease',
            '& > *': {
                overflow: 'hidden',
            },
            gridTemplateRows: '0fr'
        },
        Layout : {
            position: { xs: 'fixed', md: 'sticky' },
            transform: {
                xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))',
                md: 'none',
            },
            transition: 'transform 0.4s, width 0.4s',
            zIndex: 100, //10000
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
        },
        Overlay : {
            position: 'fixed',
            zIndex: 98, //9998
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
        ListItemButton : {
            minHeight: 0,
            overflow: 'hidden auto',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
        },
        List : {
            gap: 1,
            '--List-nestedInsetStart': '30px',
            '--ListItem-radius': (theme) => theme.vars.radius.sm,
        },
        ListButton : {
            mt: 'auto',
            flexGrow: 0,
            '--ListItem-radius': (theme) => theme.vars.radius.sm,
            '--List-gap': '8px',
            mb: 2,
        }
    },
    Navbar : {
        display: { sm: 'flex', md: 'none' },
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        width: '100vw',
        height: 'var(--Header-height)',
        zIndex: 95, //9995
        p: 2,
        gap: 1,
        borderBottom: '1px solid',
        borderColor: 'background.level1',
        boxShadow: 'sm',
    }
}