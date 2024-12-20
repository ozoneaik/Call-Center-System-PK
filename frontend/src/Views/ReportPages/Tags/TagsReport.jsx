import {Grid2} from "@mui/material";
import {Table} from "@mui/joy";

export default function TagsReport() {
    return (
        <>
            <Grid2 size={6}>
                <Table borderAxis="both">
                    <thead>
                    <tr>
                        <th>แท็คการจบสนทนา</th>
                        <th>จำนวนเค</th>
                    </tr>
                    </thead>
                    <tbody>
                    {[1, 2, 3, 4].map((item, index) => (
                        <tr key={index}>
                            <td>{item}</td>
                            <td>{item+1}</td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
            </Grid2>
        </>
    )
}