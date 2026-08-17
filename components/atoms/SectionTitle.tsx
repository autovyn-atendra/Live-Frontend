const SectionTitle = ({ title }) => {
  return (
    <div
      className={`wow fadeInUp w-full mx-auto text-center`}
      data-wow-delay=".1s"
    >
      <h2 className="mb-4 text-3xl font-bold !leading-tight text-black dark:text-white sm:text-4xl md:text-[45px]">
        {title}
      </h2>
    </div>
  );
};

export default SectionTitle;
