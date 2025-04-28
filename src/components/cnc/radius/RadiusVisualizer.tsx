"use client";

import React, { JSX } from 'react';
import {
    SVG_VIEW_SIZE,
    SVG_PADDING,
    DEFAULT_VISUALIZER_DIMENSIONS
} from '@/lib/cncConstants'; // Adjusted import path

// --- Constants (can be passed as props or imported if moved) ---
// const SVG_VIEW_SIZE = 400;
// const SVG_PADDING = 25;
// const DEFAULT_VISUALIZER_DIMENSIONS = { r: 900, w: 90, a: 90 }; // Used for placeholder

// --- Helper Functions ---

/**
 * Converts polar coordinates (radius, angle) to Cartesian coordinates (x, y)
 * relative to a center point (cx, cy).
 */
const polarToCartesian = (cx: number, cy: number, radius_svg: number, angleInDegrees: number): { x: number; y: number } => {
    const angleInRadians = angleInDegrees * Math.PI / 180.0;
    // Handle near-zero cosines/sines to avoid floating point issues if needed
    const cosA = Math.abs(Math.cos(angleInRadians)) < 1e-10 ? 0 : Math.cos(angleInRadians);
    const sinA = Math.abs(Math.sin(angleInRadians)) < 1e-10 ? 0 : Math.sin(angleInRadians);
    return {
        x: cx + radius_svg * cosA,
        y: cy + radius_svg * sinA
    };
};

/**
 * Calculates scale and transform for adaptive scaling, fitting the shape within the view.
 */
const calculateAdaptiveScaleAndTransform = (r_mm: number, R_mm: number, a_deg: number): { scale: number; translateX: number; translateY: number } => {
    const svgMidPoint = SVG_VIEW_SIZE / 2;
    const drawingSize = SVG_VIEW_SIZE - 2 * SVG_PADDING;
    let scale = 1, translateX = 0, translateY = 0;

    if (R_mm > 0 && a_deg > 0) {
        const a_rad = a_deg * Math.PI / 180;
        const start_rad_svg = -Math.PI / 2; // Start angle for SVG drawing (points upwards)
        const end_rad_svg = start_rad_svg + a_rad;
        const getPointMM = (radius: number, angleRad: number) => ({ x: radius * Math.cos(angleRad), y: radius * Math.sin(angleRad) });

        // Critical points for bounding box calculation
        const points_mm = [
            getPointMM(r_mm, start_rad_svg),
            getPointMM(R_mm, start_rad_svg),
            getPointMM(r_mm, end_rad_svg),
            getPointMM(R_mm, end_rad_svg),
        ];

        // Add points on axes if the arc crosses them
        const axes_rad_svg = [0, Math.PI / 2, Math.PI, -Math.PI / 2]; // 0, 90, 180, 270 degrees
        const twoPi = 2 * Math.PI;
        for (const axisAngle of axes_rad_svg) {
            const normStart = start_rad_svg; let normEnd = end_rad_svg; let currentAngle = axisAngle;
            // Normalize angles to be comparable
            while (normEnd < normStart) normEnd += twoPi;
            while (currentAngle < normStart) currentAngle += twoPi;
            const epsilonRad = 1e-9;
            if (currentAngle >= normStart - epsilonRad && currentAngle <= normEnd + epsilonRad) {
                points_mm.push(getPointMM(R_mm, axisAngle)); // Check outer radius intersection
            }
        }

        // Add midpoint of outer arc for better bounding box
        const midAngleRad = start_rad_svg + a_rad / 2;
        points_mm.push(getPointMM(R_mm, midAngleRad));
        if (r_mm > 0) {
            points_mm.push(getPointMM(r_mm, midAngleRad)); // Add midpoint of inner arc if exists
        }

        // Calculate bounding box in mm
        const x_coords_mm = points_mm.map(p => p.x);
        const y_coords_mm = points_mm.map(p => p.y);
        const minX_mm = Math.min(...x_coords_mm);
        const maxX_mm = Math.max(...x_coords_mm);
        const minY_mm = Math.min(...y_coords_mm);
        const maxY_mm = Math.max(...y_coords_mm);
        const bboxWidth_mm = maxX_mm - minX_mm;
        const bboxHeight_mm = maxY_mm - minY_mm;

        // Calculate scale
        const epsilon = 1e-6;
        if (bboxWidth_mm > epsilon && bboxHeight_mm > epsilon) {
            scale = Math.min(drawingSize / bboxWidth_mm, drawingSize / bboxHeight_mm);
        } else if (bboxWidth_mm > epsilon) { scale = drawingSize / bboxWidth_mm; }
        else if (bboxHeight_mm > epsilon) { scale = drawingSize / bboxHeight_mm; }
        else { scale = 1; } // Avoid division by zero for point/line shapes
        scale = Math.max(1e-6, scale); // Prevent zero or negative scale

        // Calculate Translation Offset based on scaled points' center
        const scaled_points = points_mm.map(p => ({ x: p.x * scale, y: p.y * scale }));
        const minX_svg_rel = Math.min(...scaled_points.map(p => p.x));
        const maxX_svg_rel = Math.max(...scaled_points.map(p => p.x));
        const minY_svg_rel = Math.min(...scaled_points.map(p => p.y));
        const maxY_svg_rel = Math.max(...scaled_points.map(p => p.y));
        const scaledBboxCenterX = (minX_svg_rel + maxX_svg_rel) / 2;
        const scaledBboxCenterY = (minY_svg_rel + maxY_svg_rel) / 2;

        translateX = svgMidPoint - scaledBboxCenterX;
        translateY = svgMidPoint - scaledBboxCenterY;
    }

    // Ensure finite values
     if (!isFinite(scale) || scale <= 0) scale = 1;
     if (!isFinite(translateX)) translateX = 0;
     if (!isFinite(translateY)) translateY = 0;

    return { scale, translateX, translateY };
}

// --- Component Props Interface ---
interface RadiusVisualizerProps {
  radius: string;
  width: string;
  angle: string;
  isTooLarge: boolean;
  numSplits: number;
  // Optional: Pass constants if they are moved out
  // viewSize?: number;
  // padding?: number;
}

// --- The Visualizer Component ---
const RadiusVisualizer: React.FC<RadiusVisualizerProps> = ({ radius, width, angle, isTooLarge, numSplits }) => {

    const r_input = parseFloat(radius);
    const w_input = parseFloat(width);
    const a_input = parseFloat(angle);

    const isInputValid = !isNaN(r_input) && !isNaN(w_input) && !isNaN(a_input) && r_input > 0 && w_input >= 0 && a_input > 0 && a_input <= 360;

    // --- Determine dimensions, scale and center offset ---
    const r = isInputValid ? r_input : DEFAULT_VISUALIZER_DIMENSIONS.r;
    const w = isInputValid ? w_input : DEFAULT_VISUALIZER_DIMENSIONS.w;
    const a = isInputValid ? a_input : DEFAULT_VISUALIZER_DIMENSIONS.a;
    const outerRadiusActual = r + w;

    const viewSize = SVG_VIEW_SIZE;
    const padding = SVG_PADDING;
    const drawingSize = viewSize - 2 * padding;
    const svgMidPoint = viewSize / 2;

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let useTransform = false;
    let originX = svgMidPoint; // Default origin if no transform applied
    let originY = svgMidPoint;

    if (outerRadiusActual > 0 && a > 0) {
        // --- CONDITIONAL SCALING LOGIC ---
        if (a > 90 && isInputValid) {
            // Use Adaptive Scaling for angles > 90 deg
            useTransform = true;
            ({ scale, translateX, translateY } = calculateAdaptiveScaleAndTransform(r, outerRadiusActual, a));
            originX = 0; // Draw relative to 0,0 inside transform group
            originY = 0;
        } else {
            // Use Fixed Scaling (based on 90deg adaptive calc) for angles <= 90 deg OR placeholder
            useTransform = true; // Use transform to apply the calculated centering
            const effective_r = isInputValid ? r : DEFAULT_VISUALIZER_DIMENSIONS.r;
            const effective_R = isInputValid ? outerRadiusActual : DEFAULT_VISUALIZER_DIMENSIONS.r + DEFAULT_VISUALIZER_DIMENSIONS.w;
            // Calculate scale/transform AS IF it were 90 degrees to keep consistent scale for small angles
            ({ scale, translateX, translateY } = calculateAdaptiveScaleAndTransform(effective_r, effective_R, 90));
            originX = 0; // Draw relative to 0,0 inside transform group
            originY = 0;
        }
    } else {
        // Handle zero radius or angle (use simple default scaling centered directly)
        const defaultOuterRadius = DEFAULT_VISUALIZER_DIMENSIONS.r + DEFAULT_VISUALIZER_DIMENSIONS.w;
        scale = defaultOuterRadius > 0 ? drawingSize / (2 * defaultOuterRadius) : 1;
        scale = Math.max(1e-6, scale);
        useTransform = false; // Draw directly centered, no transform needed
        originX = svgMidPoint;
        originY = svgMidPoint;
    }

    // --- Calculate final SVG coordinates --- (Relative to originX, originY)
    const innerR_svg = r * scale;
    const outerR_svg = outerRadiusActual * scale;
    const startAngleDeg = -90; // SVG 0 degrees is right, -90 is up
    const endAngleDeg = startAngleDeg + a;
    const largeArcFlag = a > 180 ? 1 : 0;
    const midAngleDeg = startAngleDeg + a / 2;

    const p1_outerStart = polarToCartesian(originX, originY, outerR_svg, startAngleDeg);
    const p2_outerEnd   = polarToCartesian(originX, originY, outerR_svg, endAngleDeg);
    const p3_innerEnd   = polarToCartesian(originX, originY, innerR_svg, endAngleDeg);
    const p4_innerStart = polarToCartesian(originX, originY, innerR_svg, startAngleDeg);

    const arcPath = `
        M ${p1_outerStart.x.toFixed(3)},${p1_outerStart.y.toFixed(3)}
        A ${outerR_svg.toFixed(3)},${outerR_svg.toFixed(3)} 0 ${largeArcFlag} 1 ${p2_outerEnd.x.toFixed(3)},${p2_outerEnd.y.toFixed(3)}
        L ${p3_innerEnd.x.toFixed(3)},${p3_innerEnd.y.toFixed(3)}
        A ${innerR_svg.toFixed(3)},${innerR_svg.toFixed(3)} 0 ${largeArcFlag} 0 ${p4_innerStart.x.toFixed(3)},${p4_innerStart.y.toFixed(3)}
        Z`;

    // --- Calculate Label Positions --- (Relative to originX, originY)
    const rLabelPos = polarToCartesian(originX, originY, innerR_svg / 2, startAngleDeg + Math.min(a / 4, 10));
    const wLabelMidRadius_svg = innerR_svg + (outerR_svg - innerR_svg) / 2;
    const wLabelPos = polarToCartesian(originX, originY, wLabelMidRadius_svg, endAngleDeg + 3); // Slight offset for clarity

    const angleLabelRadius_svg = Math.max(10, Math.min(innerR_svg * 0.4, 25)); // Keep angle arc reasonable size
    const angleLabelPos = polarToCartesian(originX, originY, angleLabelRadius_svg * 1.3, midAngleDeg);
    const angleArcStart = polarToCartesian(originX, originY, angleLabelRadius_svg, startAngleDeg);
    const angleArcEnd = polarToCartesian(originX, originY, angleLabelRadius_svg, endAngleDeg);
    const angleArcPath = `M ${angleArcStart.x.toFixed(3)} ${angleArcStart.y.toFixed(3)} A ${angleLabelRadius_svg.toFixed(3)},${angleLabelRadius_svg.toFixed(3)} 0 ${largeArcFlag} 1 ${angleArcEnd.x.toFixed(3)},${angleArcEnd.y.toFixed(3)}`;

    const arcLabelOffset_pixels = 16;
    const arcMidPoint = polarToCartesian(originX, originY, outerR_svg, midAngleDeg);
    const arcNormalAngleRad = (midAngleDeg + 90) * Math.PI / 180; // Normal to the arc at midpoint
    const arcLabelPos = {
         x: arcMidPoint.x + arcLabelOffset_pixels * Math.cos(arcNormalAngleRad),
         y: arcMidPoint.y + arcLabelOffset_pixels * Math.sin(arcNormalAngleRad)
    };

    const chordStart = p1_outerStart;
    const chordEnd = p2_outerEnd;
    const chordMidPoint = { x: (chordStart.x + chordEnd.x) / 2, y: (chordStart.y + chordEnd.y) / 2 };
    const chordAngleDeg = Math.atan2(chordEnd.y - chordStart.y, chordEnd.x - chordStart.x) * (180 / Math.PI);

    // --- Generate Split Lines --- (if needed)
    const splitLines: JSX.Element[] = [];
    if (isInputValid && isTooLarge && numSplits > 1) {
        const anglePerSplit = a / numSplits;
        for (let i = 1; i < numSplits; i++) {
            const splitAngle = startAngleDeg + i * anglePerSplit;
            const splitInner = polarToCartesian(originX, originY, innerR_svg, splitAngle);
            const splitOuter = polarToCartesian(originX, originY, outerR_svg, splitAngle);
            splitLines.push(
                <line
                    key={`split-${i}`}
                    x1={splitInner.x.toFixed(3)}
                    y1={splitInner.y.toFixed(3)}
                    x2={splitOuter.x.toFixed(3)}
                    y2={splitOuter.y.toFixed(3)}
                    stroke="#ef4444" // red-500
                    strokeWidth="1"
                />
            );
        }
    }

    // --- Determine Labels and Colors --- (based on validity)
    const fillColor = isInputValid ? "#e0e7ff" : "#e5e7eb"; // indigo-100 or gray-200
    const strokeColor = isInputValid ? "#4f46e5" : "#9ca3af"; // indigo-600 or gray-400
    const labelClass = isInputValid ? "text-xs text-indigo-700 font-medium" : "text-xs text-gray-500";
    const guideStrokeColor = isInputValid ? "#a5b4fc" : "#d1d5db"; // indigo-300 or gray-300

    const angleLabelContent = isInputValid ? `θ=${a}°` : 'θ';
    const rLabelContent = isInputValid ? `r=${r_input}` : 'r';
    const wLabelContent = isInputValid ? `w=${w_input}` : 'w';
    const arcLengthValue = isInputValid ? ((Math.PI * outerRadiusActual * a) / 180).toFixed(1) : 'L';
    const chordLengthValue = isInputValid ? (2 * outerRadiusActual * Math.sin((a * Math.PI) / 360)).toFixed(1) : 'c';
    const lLabelContent = isInputValid ? `L=${arcLengthValue}` : 'L';
    const cLabelContent = isInputValid ? `c=${chordLengthValue}` : 'c';

    // --- Warning Message --- (if needed)
    const warningMessage = (isInputValid && isTooLarge && numSplits > 1) ?
        `Radius is too large to fit on single sheet. Will be split into ${numSplits} even sections.` : null;

    return (
        <div className="flex flex-col items-center">
            <svg width="100%" height="100%" viewBox={`0 0 ${viewSize} ${viewSize}`}
                 className="bg-white rounded-md shadow-sm border border-gray-200 aspect-square">
                <defs>
                    {/* Marker for dimension lines */}
                    <marker id="obliqueTick" viewBox="0 0 10 10" refX="5" refY="5"
                            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 5 L 10 5" stroke="currentColor" strokeWidth="1.5" transform="rotate(45 5 5)"/>
                    </marker>
                </defs>

                <g transform={useTransform ? `translate(${translateX.toFixed(3)}, ${translateY.toFixed(3)})` : undefined}>
                    {/* --- Guide Lines (Dim Lines) --- */}
                    <line x1={originX.toFixed(3)} y1={originY.toFixed(3)} x2={p4_innerStart.x.toFixed(3)} y2={p4_innerStart.y.toFixed(3)} stroke={guideStrokeColor} strokeWidth="1" markerStart="url(#obliqueTick)" markerEnd="url(#obliqueTick)" />
                    <line x1={originX.toFixed(3)} y1={originY.toFixed(3)} x2={p3_innerEnd.x.toFixed(3)} y2={p3_innerEnd.y.toFixed(3)} stroke={guideStrokeColor} strokeWidth="1" markerStart="url(#obliqueTick)" markerEnd="url(#obliqueTick)" />
                    { w > 0 && (
                        <>
                            <line x1={p4_innerStart.x.toFixed(3)} y1={p4_innerStart.y.toFixed(3)} x2={p1_outerStart.x.toFixed(3)} y2={p1_outerStart.y.toFixed(3)} stroke={guideStrokeColor} strokeWidth="1" markerStart="url(#obliqueTick)" markerEnd="url(#obliqueTick)" />
                            <line x1={p3_innerEnd.x.toFixed(3)} y1={p3_innerEnd.y.toFixed(3)} x2={p2_outerEnd.x.toFixed(3)} y2={p2_outerEnd.y.toFixed(3)} stroke={guideStrokeColor} strokeWidth="1" markerStart="url(#obliqueTick)" markerEnd="url(#obliqueTick)" />
                        </>
                    )}

                    {/* --- Main Shape Path --- */}
                    <path d={arcPath} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />

                    {/* --- Split Lines --- */}
                    {splitLines}

                    {/* --- Angle Arc --- */}
                    <path d={angleArcPath} fill="none" stroke="#6b7280" strokeWidth="1" markerStart="url(#obliqueTick)" markerEnd="url(#obliqueTick)"/>

                    {/* --- Chord Line --- */}
                    <line x1={chordStart.x.toFixed(3)} y1={chordStart.y.toFixed(3)} x2={chordEnd.x.toFixed(3)} y2={chordEnd.y.toFixed(3)} stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" markerStart="url(#obliqueTick)" markerEnd="url(#obliqueTick)"/>

                    {/* --- Labels --- */}
                    <text x={angleLabelPos.x.toFixed(3)} y={angleLabelPos.y.toFixed(3)} dy="0.3em" textAnchor="middle" className={labelClass}>{angleLabelContent}</text>
                    { innerR_svg > 10 && <text x={rLabelPos.x.toFixed(3)} y={rLabelPos.y.toFixed(3)} dx={-5} dy={isInputValid ? 0 : -2} textAnchor="end" alignmentBaseline="middle" className={labelClass} transform={`rotate(${startAngleDeg + 90} ${rLabelPos.x.toFixed(3)} ${rLabelPos.y.toFixed(3)})`}>{rLabelContent}</text>}
                    { w > 0 && outerR_svg - innerR_svg > 10 && <text x={wLabelPos.x.toFixed(3)} y={wLabelPos.y.toFixed(3)} dx={-5} dy={isInputValid ? 0 : -2} textAnchor="end" alignmentBaseline="middle" className={labelClass}>{wLabelContent}</text>}
                    <text x={arcLabelPos.x.toFixed(3)} y={arcLabelPos.y.toFixed(3)} textAnchor="middle" alignmentBaseline="middle" className={labelClass} transform={`rotate(${midAngleDeg + 90} ${arcLabelPos.x.toFixed(3)} ${arcLabelPos.y.toFixed(3)})`}>{lLabelContent}</text>
                    <text x={chordMidPoint.x.toFixed(3)} y={chordMidPoint.y.toFixed(3)} dy={-4} textAnchor="middle" alignmentBaseline="baseline" className={labelClass} transform={`rotate(${chordAngleDeg} ${chordMidPoint.x.toFixed(3)} ${chordMidPoint.y.toFixed(3)})`}>{cLabelContent}</text>
                </g>
            </svg>
            {warningMessage && (
                <div className="text-center text-red-600 text-sm mt-2 font-medium min-h-[1.25rem]">
                    {warningMessage}
                </div>
            )}
            {!warningMessage && <div className="min-h-[1.25rem] mt-2"></div>} {/* Placeholder to prevent layout shift */}
        </div>
    );
};

export default RadiusVisualizer; 