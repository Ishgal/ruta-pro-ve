'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, FileText, HelpCircle, Presentation, ChevronLeft, ChevronRight } from 'lucide-react';

export type ViewerLesson = {
  id: string;
  title: string;
  videoUrl: string | null;
  content: string | null;
  slidesUrl: string | null;
  displayOrder: number;
  duration: string | null;
  lessonType: 'video' | 'article' | 'quiz' | 'slides';
};

type Props = {
  courseTitle: string;
  lessons: ViewerLesson[];
};

const lessonIcons = {
  video: Play,
  article: FileText,
  quiz: HelpCircle,
  slides: Presentation,
} as const;

const lessonTypeLabel = {
  video: 'Video',
  article: 'Lectura',
  quiz: 'Evaluacion',
  slides: 'Diapositivas',
} as const;

const VIDEO_BASE = 'w-full aspect-video bg-[#0D1117] rounded-2xl overflow-hidden relative';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getEmbedUrl(url: string): string | null {
  const ytId = extractYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function VideoPlayer({ lesson }: { lesson: ViewerLesson }) {
  const [playing, setPlaying] = useState(false);

  if (!lesson.videoUrl) {
    return (
      <div className={`${VIDEO_BASE} flex flex-col items-center justify-center gap-3`}>
        <Play className="w-10 h-10 text-white/20" />
        <p className="text-white/25 text-xs">Video no disponible</p>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(lesson.videoUrl);

  if (!embedUrl) {
    return (
      <div className={VIDEO_BASE}>
        <video src={lesson.videoUrl} controls className="absolute inset-0 w-full h-full object-contain" />
      </div>
    );
  }

  const ytId = extractYouTubeId(lesson.videoUrl);
  const thumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;

  if (playing) {
    return (
      <div className={VIDEO_BASE}>
        <iframe
          src={`${embedUrl}&autoplay=1`}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  return (
    <div className={`${VIDEO_BASE} cursor-pointer group`} onClick={() => setPlaying(true)}>
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1117] to-[#1a2744]" />
      )}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-200" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[72px] h-[72px] rounded-full bg-[#1B4F8C] group-hover:scale-110 group-hover:bg-[#1a6ab5] transition-all duration-200 flex items-center justify-center shadow-2xl ring-4 ring-white/10">
          <svg className="w-8 h-8 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {lesson.duration && (
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] px-2.5 py-1 rounded-md font-medium">
          {lesson.duration}
        </div>
      )}
    </div>
  );
}

function SlidesPlayer({ lesson }: { lesson: ViewerLesson }) {
  if (!lesson.slidesUrl) {
    return (
      <div className={`${VIDEO_BASE} flex flex-col items-center justify-center gap-3`}>
        <Presentation className="w-10 h-10 text-white/20" />
        <p className="text-white/25 text-xs">Diapositivas no disponibles</p>
      </div>
    );
  }

  const isGoogleSlides = lesson.slidesUrl.includes('docs.google.com/presentation');
  const embedUrl = isGoogleSlides && !lesson.slidesUrl.includes('/embed')
    ? lesson.slidesUrl.replace('/pub', '/embed').replace(/\/edit.*$/, '/embed')
    : lesson.slidesUrl;

  return (
    <div className={VIDEO_BASE}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        frameBorder="0"
      />
    </div>
  );
}

export default function TeacherCourseViewer({ courseTitle, lessons }: Props) {
  const [activeId, setActiveId] = useState(lessons[0]?.id ?? '');
  const activeLesson = lessons.find(l => l.id === activeId) ?? lessons[0];
  const activeIndex = lessons.findIndex(l => l.id === activeLesson?.id);

  if (!lessons.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Este curso no tiene lecciones aun.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Main content area */}
      <div className="flex-[3] min-w-0 flex flex-col gap-4">

        {/* Video */}
        {activeLesson?.lessonType === 'video' && <VideoPlayer lesson={activeLesson} />}

        {/* Slides */}
        {activeLesson?.lessonType === 'slides' && <SlidesPlayer lesson={activeLesson} />}

        {/* Article / quiz banner */}
        {(activeLesson?.lessonType === 'article' || activeLesson?.lessonType === 'quiz') && (
          <div className="bg-gradient-to-br from-[#1B4F8C] to-[#00B5B5] rounded-2xl p-7 flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-1">
                {courseTitle} · {lessonTypeLabel[activeLesson.lessonType]}
              </p>
              <h2 className="text-lg font-bold text-white leading-snug">{activeLesson.title}</h2>
              {activeLesson.duration && <p className="text-sm text-white/60 mt-0.5">{activeLesson.duration}</p>}
            </div>
          </div>
        )}

        {/* Info card */}
        <div className="bg-white rounded-2xl px-5 py-5">
          {activeLesson?.lessonType !== 'article' && activeLesson?.lessonType !== 'quiz' && (
            <>
              <p className="text-[10px] font-semibold text-[#00B5B5] uppercase tracking-wide mb-1">{courseTitle}</p>
              <h2 className="text-base font-bold text-gray-900">{activeLesson?.title}</h2>
              {activeLesson?.duration && (
                <p className="text-xs text-gray-400 mt-0.5">{activeLesson.duration}</p>
              )}
            </>
          )}

          {activeLesson?.content ? (
            <div className={`prose prose-sm max-w-none text-gray-600 leading-relaxed ${
              activeLesson.lessonType === 'article' || activeLesson.lessonType === 'quiz' ? '' : 'mt-3'
            }`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeLesson.content}
              </ReactMarkdown>
            </div>
          ) : (activeLesson?.lessonType === 'article' || activeLesson?.lessonType === 'quiz') ? (
            <p className="text-sm text-gray-400 italic">Esta leccion no tiene contenido todavia.</p>
          ) : null}

          {/* Prev / Next navigation */}
          <div className="flex items-center gap-3 mt-4">
            {activeIndex > 0 && (
              <button
                onClick={() => setActiveId(lessons[activeIndex - 1].id)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
            )}
            {activeIndex < lessons.length - 1 && (
              <button
                onClick={() => setActiveId(lessons[activeIndex + 1].id)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all ml-auto"
              >
                Siguiente
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar: lesson list */}
      <div className="flex-[2] lg:min-w-[260px] flex flex-col gap-4">
        <div className="bg-[#EEEEF3] rounded-2xl p-4">
          <p className="text-sm font-bold text-gray-800 mb-3">
            Contenido del curso
            <span className="ml-2 text-xs font-normal text-gray-500">({lessons.length} lecciones)</span>
          </p>
          <div className="flex flex-col gap-0.5">
            {lessons.map((lesson, index) => {
              const isActive = lesson.id === activeId;
              const Icon = lessonIcons[lesson.lessonType];
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveId(lesson.id)}
                  className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-all ${
                    isActive ? 'bg-white shadow-sm' : 'hover:bg-white/70'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    isActive ? 'bg-blue-600' : 'bg-white border-2 border-gray-200'
                  }`}>
                    {isActive ? (
                      <Icon className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-snug truncate ${
                      isActive ? 'text-blue-700 font-semibold' : 'text-gray-700'
                    }`}>
                      {lesson.title}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                      {[lesson.duration, lessonTypeLabel[lesson.lessonType]].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
