import Sheet from "@mui/joy/Sheet";
import Input from "@mui/joy/Input";
import {Checkbox, Table} from "@mui/joy";
import Link from "@mui/joy/Link";
import Typography from "@mui/joy/Typography";
import Chip from "@mui/joy/Chip";
import Box from "@mui/joy/Box";
import Avatar from "@mui/joy/Avatar";
import {users} from "../../Components/data.jsx";

function CustomerTable() {
    return (
        <>
            <Sheet
                className="SearchAndFilters-mobile"
                // sx={{ display: { xs: 'flex', sm: 'none' }, my: 1, gap: 1 }}
            >
                <Sheet
                    className="OrderTableContainer"
                    variant="outlined"
                    sx={{
                        // display: { xs: 'none', sm: 'initial' },
                        width: '100%',
                        borderRadius: 'sm',
                        flexShrink: 1,
                        overflow: 'auto',
                        minHeight: 0,
                    }}
                >
                    <Table
                        // aria-labelledby="tableTitle"
                        // stickyHeader
                        // hoverRow
                        // sx={{
                        //     '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
                        //     '--Table-headerUnderlineThickness': '1px',
                        //     '--TableRow-hoverBackground': 'var(--joy-palette-background-level1)',
                        //     '--TableCell-paddingY': '4px',
                        //     '--TableCell-paddingX': '8px',
                        // }}
                    >
                        <thead>
                        <tr>
                            
                            <th style={{ width: 140, padding: '12px 6px' }}>Date</th>
                            <th style={{ width: 140, padding: '12px 6px' }}>Status</th>
                            <th style={{ width: 240, padding: '12px 6px' }}>Customer</th>
                            <th style={{ width: 140, padding: '12px 6px' }}> </th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((row,index) => (
                            <tr key={index}>

                                <td>
                                    <Typography level="body-xs">{row.id}</Typography>
                                </td>
                                <td>
                                    <Typography level="body-xs">{row.name}</Typography>
                                </td>
                                <td>
                                    <Chip
                                        variant="soft"
                                        size="sm"
                                    >
                                        {row.status}
                                    </Chip>
                                </td>
                                <td>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Avatar size="sm" src={row.avatar}></Avatar>
                                        <div>
                                            <Typography level="body-xs">{row.name}</Typography>
                                            <Typography level="body-xs">{row.username}</Typography>
                                        </div>
                                    </Box>
                                </td>
                                <td>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Link level="body-xs" component="button">
                                            Download
                                        </Link>
                                    </Box>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Sheet>
            </Sheet>
        </>
    );
}

export default CustomerTable;