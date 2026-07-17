import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Html } from '@react-three/drei';

// Helper component to render a single seat with desk
const Seat = ({ id, position, status, studentInfo }) => {
  const [hovered, setHovered] = useState(false);

  // Determine colors based on status
  let seatColor = '#ef4444'; // Red (Absent)
  let emissiveColor = '#7f1d1d';
  let emissiveIntensity = 0;

  if (status === 'present') {
    seatColor = '#22c55e'; // Green
    emissiveColor = '#22c55e';
    emissiveIntensity = 0.5;
  } else if (status === 'late') {
    seatColor = '#eab308'; // Yellow
    emissiveColor = '#eab308';
    emissiveIntensity = 0.5;
  } else if (status === 'leave') {
    seatColor = '#3b82f6'; // Blue
    emissiveColor = '#3b82f6';
    emissiveIntensity = 0.5;
  }

  // If absent, we can also give it a faint red glow to make it visible
  if (status === 'absent' || !status) {
    emissiveColor = '#ef4444';
    emissiveIntensity = 0.3;
  }

  return (
    <group position={position}>
      {/* Desk */}
      <mesh position={[0, 0.4, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.05, 0.4]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* Desk legs */}
      <mesh position={[-0.35, 0.2, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 0.4, 0.3]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.35, 0.2, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.05, 0.4, 0.3]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Chair Seat */}
      <mesh 
        position={[0, 0.25, -0.2]} 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.5, 0.05, 0.4]} />
        <meshStandardMaterial 
          color={seatColor} 
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          toneMapped={false}
        />
      </mesh>
      
      {/* Chair Backrest */}
      <mesh position={[0, 0.5, -0.375]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial 
          color={seatColor} 
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          toneMapped={false}
        />
      </mesh>

      {/* Chair legs */}
      <mesh position={[0, 0.125, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.25, 0.3]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Tooltip on Hover */}
      {hovered && (
        <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10 w-48 pointer-events-none transform transition-all">
            <div className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">{id}</div>
            <div className="font-bold text-sm truncate">{studentInfo?.name || 'Unknown Student'}</div>
            <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
              <span>{studentInfo?.rollNo || 'N/A'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                status === 'present' ? 'bg-green-500/20 text-green-400' :
                status === 'late' ? 'bg-yellow-500/20 text-yellow-400' :
                status === 'leave' ? 'bg-blue-500/20 text-blue-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {(status || 'ABSENT').toUpperCase()}
              </span>
            </div>
            {studentInfo?.time && (
              <div className="text-[10px] text-slate-400 mt-2">In: {studentInfo.time}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default function Classroom3D({ liveData, sectionName = "MCA Section A" }) {
  // Generate 42 seats (7 rows, 6 columns)
  const rows = 7;
  const cols = 6;
  const seats = [];
  
  // Classroom layout dimensions
  const rowSpacing = 1.5;
  const colSpacing = 1.2;
  const startX = -((cols - 1) * colSpacing) / 2;
  const startZ = -1; // start slightly back from front

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seatNumber = r * cols + c + 1;
      const seatId = `Seat_${seatNumber.toString().padStart(2, '0')}`;
      seats.push({
        id: seatId,
        x: startX + c * colSpacing,
        z: startZ + r * rowSpacing
      });
    }
  }

  return (
    <div className="w-full h-[600px] relative rounded-2xl overflow-hidden bg-slate-950 border border-ink-border/50 shadow-2xl shadow-black/50">
      <Canvas shadows camera={{ position: [0, 8, 12], fov: 45 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#4f46e5" />
        
        {/* Soft realistic environment */}
        <Environment preset="city" />

        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>

        {/* Front Wall */}
        <mesh position={[0, 3, -4]} receiveShadow>
          <boxGeometry args={[20, 6, 0.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>

        {/* Right Wall with Windows (Simulated) */}
        <mesh position={[10, 3, 8.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[25, 6, 0.2]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
        </mesh>
        
        {/* Large Interactive LED Display */}
        <group position={[0, 2.5, -3.8]}>
          <mesh castShadow>
            <boxGeometry args={[8, 4, 0.2]} />
            <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.8} />
          </mesh>
          {/* Screen Glow */}
          <mesh position={[0, 0, 0.11]}>
            <planeGeometry args={[7.8, 3.8]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <Text 
            position={[0, 0.5, 0.12]} 
            fontSize={0.6} 
            color="#38bdf8"
            anchorX="center" 
            anchorY="middle"
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
          >
            {sectionName}
          </Text>
          <Text 
            position={[0, -0.5, 0.12]} 
            fontSize={0.25} 
            color="#94a3b8"
            anchorX="center" 
            anchorY="middle"
          >
            Live Attendance Session Active
          </Text>
          <Text 
            position={[0, -1.2, 0.12]} 
            fontSize={0.2} 
            color="#ef4444"
            anchorX="center" 
            anchorY="middle"
          >
            🔴 LIVE
          </Text>
        </group>

        {/* Teacher Table */}
        <group position={[0, 0, -2]}>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 1, 0.8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 1.025, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.05, 0.9]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
        </group>

        {/* Render Seats */}
        {seats.map((seat) => {
          const studentData = liveData?.[seat.id];
          return (
            <Seat 
              key={seat.id} 
              id={seat.id} 
              position={[seat.x, 0, seat.z]} 
              status={studentData?.status || 'absent'}
              studentInfo={studentData}
            />
          );
        })}

        {/* Camera Controls */}
        <OrbitControls 
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
        <div className="glass-card px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3 backdrop-blur-md bg-black/40">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          <span className="text-white text-sm font-bold text-shadow">Present</span>
        </div>
        <div className="glass-card px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3 backdrop-blur-md bg-black/40">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          <span className="text-white text-sm font-bold text-shadow">Absent</span>
        </div>
        <div className="glass-card px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3 backdrop-blur-md bg-black/40">
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
          <span className="text-white text-sm font-bold text-shadow">Late</span>
        </div>
      </div>
    </div>
  );
}
