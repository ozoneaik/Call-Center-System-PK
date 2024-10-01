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

export function convertFullDate(date) {
    const D = new Date(date);
    const day = String(D.getDate());
    const month = String(D.getMonth() + 1);
    const year = String(D.getFullYear());
    const hours = String(D.getHours()).padStart(2, '0');
    const minutes = String(D.getMinutes()).padStart(2, '0');
    const seconds = String(D.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    // return `${hours}:${minutes}:${seconds}`;
}

export const differentDate = (startTime) => {
    const startAt = new Date(startTime);
    const now = new Date();
    // คำนวณความต่างของเวลาในหน่วย milliseconds
    const diffInMillis = now - startAt;
    // แปลง millisecond เป็นวินาที
    let diffInSeconds = Math.floor(diffInMillis / 1000);
    // คำนวณจำนวนวัน ชั่วโมง นาที และวินาที
    const days = Math.floor(diffInSeconds / (3600 * 24));
    diffInSeconds %= 3600 * 24;
    const hours = Math.floor(diffInSeconds / 3600);
    diffInSeconds %= 3600;
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    return `${days} วัน ${hours} ชั่วโมง ${minutes} นาที ${seconds} วินาที`;
}
