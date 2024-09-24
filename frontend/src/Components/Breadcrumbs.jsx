import Typography from "@mui/joy/Typography";
import {Breadcrumbs} from "@mui/joy";

export default function BreadcrumbsComponent(props) {
    const {list} = props;
    return (
        <>
            <Breadcrumbs size="sm" aria-label="breadcrumbs" sx={{pl: 0}}>
                <Breadcrumbs size="sm" aria-label="breadcrumbs" sx={{pl: 0}}>
                    {
                        list.map((item,index) => (
                            <Typography key={index} sx={{fontWeight: 500, fontSize: 14}}>
                                {item.name}
                            </Typography>
                        ))
                    }
                </Breadcrumbs>
            </Breadcrumbs>
        </>

    )
}