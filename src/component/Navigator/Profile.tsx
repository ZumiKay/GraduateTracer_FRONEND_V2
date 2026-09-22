interface ProfileIconProps {
  label: string;
  color?: string;
  size?: string;
}

export default function ProfileIcon(props: ProfileIconProps) {
  const initial = (props.label || "U")[0]?.toUpperCase() || "U";
  return (
    <div
      className={`${
        props.size || "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10"
      } rounded-full grid place-content-center bg-emerald-600 dark:bg-emerald-500 shadow-sm shrink-0 select-none transition-transform`}
    >
      <p className="text-xs sm:text-sm md:text-base font-semibold text-white leading-none">
        {initial}
      </p>
    </div>
  );
}
