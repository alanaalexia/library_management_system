export const ActionCard = ({ title, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center p-8 bg-[#E3F2FD] rounded-2xl border-2 border-[#BBDEFB] hover:bg-[#BBDEFB] transition-colors w-48 h-48 shadow-sm"
  >
    <div className="text-4xl mb-4">{icon}</div>
    <span className="font-bold text-[#1976D2] text-lg">{title}</span>
  </button>
);