export const Options = {
    randomColor : [
        {id : 1, color : 'primary'},
        {id : 2, color : 'danger'},
        {id : 3, color : 'warning'},
        {id : 4, color : 'success'},
        {id : 5, color : 'neutral'},
    ]
}

export function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * Options.randomColor.length);
    return Options.randomColor[randomIndex].color;
}


export  function convertDate(date) {
    const D = new Date(date);
    if (!(D instanceof Date) || isNaN(D.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid date';
    }
    const hours = String(D.getUTCHours()).padStart(2, '0');
    const minutes = String(D.getUTCMinutes()).padStart(2, '0');
    const seconds = String(D.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}


export function convertLocalDate(date){
    const D = new Date(date);
    const hours = String(D.getHours()).padStart(2, '0');
    const minutes = String(D.getMinutes()).padStart(2, '0');
    const seconds = String(D.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}