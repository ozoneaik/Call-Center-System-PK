const useSound = (src) => {
    const audioRef = new Audio(src);
    return audioRef.play();
};
export default useSound;