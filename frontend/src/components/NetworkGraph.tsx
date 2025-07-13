"use client";

import { useRef, useEffect } from "react";

interface GraphNode {
    id: string;
    x: number;
    y: number;
    angle: number;
    radius: number;
    speed: number;
    size: number;
    connections: string[];
    color: string;
}

export const NetworkGraph = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nodesRef = useRef<GraphNode[]>([]);
    const animationRef = useRef<number | null>(null);

    const getRandomColor = () => {
        const colors = ["#E5E5E5", "#00AEEF", "#FF4D00"];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.setTransform(
                window.devicePixelRatio,
                0,
                0,
                window.devicePixelRatio,
                0,
                0
            );
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const centerX = canvas.offsetWidth / 2;
        const centerY = canvas.offsetHeight / 2;

        const centerNode: GraphNode = {
            id: "taas",
            x: centerX,
            y: centerY,
            angle: 0,
            radius: 0,
            speed: 0,
            size: 22,
            connections: [],
            color: "#FF4D00",
        };

        const innerAgents: GraphNode[] = Array.from({ length: 8 }, (_, i) => ({
            id: `inner-${i}`,
            x: 0,
            y: 0,
            angle: (i * Math.PI * 2) / 8,
            radius: 100 + Math.random() * 30,
            speed: 0.003 + Math.random() * 0.005,
            size: 6,
            connections: ["taas"],
            color: getRandomColor(),
        }));

        const outerAgents: GraphNode[] = Array.from({ length: 12 }, (_, i) => ({
            id: `outer-${i}`,
            x: 0,
            y: 0,
            angle: (i * Math.PI * 2) / 12 + Math.PI / 12,
            radius: 180 + Math.random() * 50,
            speed: 0.002 + Math.random() * 0.004,
            size: 4,
            connections: [],
            color: getRandomColor(),
        }));

        const farAgents: GraphNode[] = Array.from({ length: 16 }, (_, i) => ({
            id: `far-${i}`,
            x: 0,
            y: 0,
            angle: (i * Math.PI * 2) / 16,
            radius: 250 + Math.random() * 60,
            speed: 0.001 + Math.random() * 0.003,
            size: 3,
            connections: [],
            color: getRandomColor(),
        }));

        outerAgents.forEach((outerNode, index) => {
            const nearestInner = innerAgents[index % innerAgents.length];
            outerNode.connections.push(nearestInner.id);
            if (Math.random() > 0.7) {
                const nextOuter = outerAgents[(index + 1) % outerAgents.length];
                outerNode.connections.push(nextOuter.id);
            }
        });

        farAgents.forEach((farNode, index) => {
            const nearestOuter =
                outerAgents[
                    Math.floor((index / farAgents.length) * outerAgents.length)
                ];
            farNode.connections.push(nearestOuter.id);
            if (Math.random() > 0.8) {
                const nextFar = farAgents[(index + 2) % farAgents.length];
                farNode.connections.push(nextFar.id);
            }
        });

        const allNodes = [
            centerNode,
            ...innerAgents,
            ...outerAgents,
            ...farAgents,
        ];
        nodesRef.current = allNodes;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
            const centerX = canvas.offsetWidth / 2;
            const centerY = canvas.offsetHeight / 2;

            allNodes.slice(1).forEach((node) => {
                node.angle += node.speed;
                node.x = centerX + Math.cos(node.angle) * node.radius;
                node.y = centerY + Math.sin(node.angle) * node.radius;
            });

            allNodes.forEach((node) => {
                node.connections.forEach((connectionId) => {
                    const targetNode = allNodes.find(
                        (n) => n.id === connectionId
                    );
                    if (targetNode) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(targetNode.x, targetNode.y);
                        ctx.strokeStyle = `${node.color}66`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                });
            });

            allNodes.forEach((node) => {
                const pulse =
                    node.id === "taas"
                        ? 0.8 + Math.sin(Date.now() * 0.002) * 0.4
                        : 0.7 +
                          Math.sin(node.angle * 3 + Date.now() * 0.001) * 0.3;

                ctx.beginPath();
                ctx.arc(node.x, node.y, node.size * 2, 0, Math.PI * 2);
                ctx.fillStyle = `${node.color}20`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();

                if (node.id === "taas") {
                    const scale = window.devicePixelRatio;
                    ctx.save();
                    ctx.scale(1 / scale, 1 / scale);
                    ctx.font = `bold ${15 * scale}px sans-serif`;
                    ctx.fillStyle = "#FFFFFF";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.shadowColor = "#FF4D00";
                    ctx.shadowBlur = 15 * scale;
                    ctx.restore();
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationRef.current)
                cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ width: "100%", height: "100%" }}
        />
    );
};
