const SingleFeature = ({ feature }) => {
  const { icon, title, paragraph } = feature;
  return (
    <div className="w-full justify-center">
      <div className="wow fadeInUp " data-wow-delay=".15s">
        <div className="flex mb-10 items-center">
          <div className="h-[70px] w-[70px] flex items-center justify-center rounded-md bg-primary bg-opacity-10 text-primary">
            {icon}
          </div>
          <h3 className="ml-5 mb-5 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
            {title}
          </h3>
        </div>

        <p className="pr-[10px] text-base font-medium space-x-4 leading-relaxed text-body-color">
          {paragraph}
        </p>
      </div>
    </div>
  );
};

export default SingleFeature;
