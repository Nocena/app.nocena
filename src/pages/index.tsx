import { useRouter } from 'next/router';
import PrimaryButton from '../components/ui/PrimaryButton';

const HomePage = () => {
  const router = useRouter();

  const handleStartChallenge = () => {
    router.push('/home');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6 px-6">
      <h1 className="text-3xl font-bold text-center">Welcome to Nocena challenger!</h1>
      <h2 className="text-xl font-light text-gray-400 text-center">
        Thanks for being part of the private beta - let me know any ideas for improvement
      </h2>
      <div className="w-auto">
        <PrimaryButton text="LFG" onClick={handleStartChallenge} className="px-16" />
      </div>
    </div>
  );
};

export default HomePage;
