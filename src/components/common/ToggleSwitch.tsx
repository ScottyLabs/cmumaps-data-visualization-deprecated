interface Props {
  isOn: boolean;
  handleToggle: () => void;
}

const ToggleSwitch = ({ isOn, handleToggle }: Props) => {
  return (
    <div
      className={`w-14 h-8 rounded-full cursor-pointer ${
        isOn ? "bg-blue-500" : "bg-gray-300"
      }`}
      onClick={handleToggle}
    >
      <div
        className={`w-6 h-6 m-1 rounded-full bg-white shadow duration-200 ease-in ${
          isOn ? "translate-x-6" : "translate-x-0"
        }`}
      ></div>
    </div>
  );
};

export default ToggleSwitch;
