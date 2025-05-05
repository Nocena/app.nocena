import ThematicText from '../../ui/ThematicText';

const RegisterWelcomeStep = () => (
  <div className="max-w-md text-center">
    <h1 className="mb-4 text-3xl font-semibold">
      <ThematicText text="Welcome" isActive /> to the <ThematicText text="challenge" isActive />
    </h1>
    <p className="text-lg text-gray-300">Get ready to earn while exploring...</p>
  </div>
);

export default RegisterWelcomeStep;
