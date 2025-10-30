interface ProfileIconProps {
  label: string;
  color: string;
  size?: string;
}

export default function ProfileIcon(props: ProfileIconProps) {
  return (
    <div
      className={`w-[50px] h-[50px] max-[450px]:w-[40px] max-[450px]:h-[40px] rounded-full grid place-content-center bg-green-500`}
    >
      <p className="text-3xl font-medium text-white">{props.label[0]}</p>
    </div>
  );
}
