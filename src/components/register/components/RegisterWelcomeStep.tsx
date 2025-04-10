import ThematicText from '../../ui/ThematicText';

const RegisterWelcomeStep = () => (
  <div className="max-w-md text-center">
    <h1 className="text-3xl font-semibold mb-4">
      <ThematicText text="Welcome" isActive /> to the <ThematicText text="challenge" isActive />
    </h1>
    <p className="text-lg text-gray-300">Get ready to earn while exploring...</p>
  </div>
);

export default RegisterWelcomeStep;
