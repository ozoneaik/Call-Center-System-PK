import {
    Modal,
    ModalDialog,
    Stack,
    Typography
} from "@mui/joy";
import { Grid2 } from "@mui/material";
import FilterControls from "./Fillter/FilterControls";
import EmployeeCards from "./EmployeeCards";
import EmployeeTable from "./EmployeeTable";
import { Close } from "@mui/icons-material";
import { IconButton } from "@mui/joy";

export default function EmployeeModal({
    open,
    onClose,
    isMobile,
    filteredEmployees,
    filterDept,
    setFilterDept,
    searchName,
    setSearchName,
    departments,
    onClickTodayClosed,
    onClickWeekClosed,
    onClickMonthClosed,
    onClickInProgress,
    onClickForwarded,
}) {
    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog layout="center" sx={{ width: '90vw', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'sticky',
                        top: 0,
                        left: '100%',
                        transform: 'translateX(-100%)',
                        zIndex: 10,
                        backgroundColor: 'background.body',
                        borderRadius: '50%',
                        mt: 1,
                        mr: 1,
                        alignSelf: 'flex-end'
                    }}
                >
                    <Close />
                </IconButton>
                <Typography level="h3" mb={2}>พนักงานทั้งหมด</Typography>
                <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
                    <FilterControls
                        filterDept={filterDept}
                        setFilterDept={setFilterDept}
                        searchName={searchName}
                        setSearchName={setSearchName}
                        departments={departments}
                        fullWidth={isMobile}
                    />
                </Stack>
                {isMobile ? (
                    <Grid2 spacing={2} container>
                        <EmployeeCards
                            employees={filteredEmployees}
                            onClickTodayClosed={onClickTodayClosed}
                            onClickWeekClosed={onClickWeekClosed}
                            onClickMonthClosed={onClickMonthClosed}
                            onClickInProgress={onClickInProgress}
                            onClickForwarded={onClickForwarded}
                        />
                    </Grid2>
                ) : (
                    // <EmployeeTable employees={filteredEmployees} />
                    <EmployeeTable
                        employees={filteredEmployees}
                        onClickTodayClosed={onClickTodayClosed}
                        onClickWeekClosed={onClickWeekClosed}
                        onClickMonthClosed={onClickMonthClosed}
                        onClickInProgress={onClickInProgress}
                        onClickForwarded={onClickForwarded}
                    />
                )}
            </ModalDialog>
        </Modal>
    );
}
