"use client";

import { useState, useRef, type ChangeEvent, useEffect } from "react";
import Image from "next/image";
import {
  Download,
  ImagePlus,
  LoaderCircle,
  Share2,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  Copy,
  Instagram,
  Send,
  Linkedin,
  Twitter,
} from "lucide-react";

import { generatePoemFromPhoto } from "@/ai/flows/generate-poem-from-photo";
import { generatePhotoFromPoem } from "@/ai/flows/generate-photo-from-poem";
import { refineGeneratedPoem } from "@/ai/flows/refine-generated-poem";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const isDevelopment = process.env.NODE_ENV === 'development';

export default function Home() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"photo-to-text" | "text-to-photo">(
    "photo-to-text"
  );

  const [imageUrl, setImageUrl] = useState<string | null>(
    PlaceHolderImages[0]?.imageUrl || null
  );
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [poem, setPoem] = useState<string>("");
  const [displayedPoem, setDisplayedPoem] = useState<string>("");
  const [textType, setTextType] = useState<string>("poem");
  const [feedback, setFeedback] = useState<string>("");

  const [isLoadingPoem, setIsLoadingPoem] = useState<boolean>(false);
  const [isRefiningPoem, setIsRefiningPoem] = useState<boolean>(false);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState<boolean>(false);

  useEffect(() => {
    let typingInterval: NodeJS.Timeout;
    if (poem && displayedPoem.length < poem.length) {
      typingInterval = setInterval(() => {
        setDisplayedPoem(poem.substring(0, displayedPoem.length + 1));
      }, 25);
    } else {
      setDisplayedPoem(poem);
    }
    return () => clearInterval(typingInterval);
  }, [poem, displayedPoem.length]);


  const handleGeneratePoem = async (dataUri: string) => {
    setIsLoadingPoem(true);
    setPoem("");
    setDisplayedPoem("");
    try {
      const result = await generatePoemFromPhoto({
        photoDataUri: dataUri,
        textType,
      });
      setPoem(result.poem);
    } catch (error) {
      console.error("Error generating poem:", error);
      toast({
        title: "Generation Failed",
        description:
          "We couldn't generate a poem for this image. Please try another one.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPoem(false);
    }
  };

  const handleRefreshPoem = async () => {
    if (imageDataUri) {
      handleGeneratePoem(imageDataUri);
    } else {
      toast({
        title: "No Image",
        description: "Please upload an image first to generate a poem.",
        variant: "destructive",
      });
    }
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImageDataUri(dataUri);
        handleGeneratePoem(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefinePoem = async () => {
    if (!poem || !feedback) return;
    setIsRefiningPoem(true);
    try {
      const result = await refineGeneratedPoem({ originalPoem: poem, feedback });
      setPoem(result.refinedPoem);
      setDisplayedPoem("");
      setFeedback("");
    } catch (error) {
      console.error("Error refining poem:", error);
      toast({
        title: "Refinement Failed",
        description: "We couldn't refine the poem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefiningPoem(false);
    }
  };

  const handleGeneratePhoto = async () => {
    if (!poem) return;
    setIsLoadingPhoto(true);
    setGeneratedImageUrl(null); // Clear previous generated image
    try {
      const result = await generatePhotoFromPoem({ poem });
      setGeneratedImageUrl(result.photoDataUri);
    } catch (error) {
      console.error("Error generating photo:", error);
      toast({
        title: "Generation Failed",
        description: "We couldn't generate a photo from this text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPhoto(false);
    }
  };
  
  const handleDownload = () => {
    let finalImageUrl = imageUrl;
    if (mode === 'text-to-photo') {
      finalImageUrl = generatedImageUrl;
    }
    
    if (!finalImageUrl) return;

    const link = document.createElement('a');
    link.href = finalImageUrl;
    
    const filename = finalImageUrl.startsWith('data:') ? 'generated-image.png' : finalImageUrl.split('/').pop() || 'image.png';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShare = async () => {
    let finalImageUrl = mode === 'text-to-photo' ? generatedImageUrl : imageUrl;
    let textToShare = poem;
    let title = 'My PhotoPoet Creation';

    if (!finalImageUrl) {
      toast({
        title: 'Nothing to share',
        description: 'Please generate an image first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(finalImageUrl!);
      const blob = await response.blob();
      const file = new File([blob], "photopoet-creation.png", { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: title,
          text: textToShare || 'Check out this creation from PhotoPoet!',
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: title,
          text: textToShare || 'Check out this creation from PhotoPoet!',
          url: finalImageUrl,
        });
      } else {
        await navigator.clipboard.writeText(textToShare || "Check out this creation from PhotoPoet!");
        toast({
          title: 'Copied to Clipboard!',
          description: 'The text has been copied. Sharing is not supported in this browser.',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: 'Sharing Failed',
          description: 'Could not share your creation.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCopy = () => {
    if (!poem) return;
    navigator.clipboard.writeText(poem);
    toast({
      title: "Copied!",
      description: "The poem has been copied to your clipboard.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Tabs
          value={mode}
          onValueChange={(value) =>
            setMode(value as "photo-to-text" | "text-to-photo")
          }
          className="mx-auto max-w-screen-xl"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photo-to-text">
              <ImageIcon className="mr-2" />
              Photo to Text
            </TabsTrigger>
            <TabsTrigger value="text-to-photo">
              <Sparkles className="mr-2" />
              Text to Photo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="photo-to-text">
            <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Image Column */}
              <div className="flex flex-col gap-4">
                <Card className="overflow-hidden shadow-lg">
                  <CardContent className="p-0">
                    <div className="aspect-[3/2] w-full bg-muted">
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt="Uploaded photograph"
                          width={1200}
                          height={800}
                          className="h-full w-full object-cover"
                          data-ai-hint={PlaceHolderImages[0]?.imageHint}
                          priority
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="mr-2 h-5 w-5" />
                    Upload Photo
                  </Button>
                </div>
              </div>

              {/* Poem Column */}
              <div className="flex flex-col space-y-6">
                <div className="flex-grow space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-headline text-3xl font-semibold tracking-tight text-primary md:text-4xl">
                      Your Verse
                    </h2>
                    <div className="flex items-center gap-2">
                       {poem && (
                          <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopy}
                          aria-label="Copy poem"
                        >
                          <Copy />
                        </Button>
                       )}
                      <Select value={textType} onValueChange={setTextType}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="story">Story</SelectItem>
                          <SelectItem value="poem">Poem</SelectItem>
                          <SelectItem value="shayari">Shayari</SelectItem>
                          <SelectItem value="ghazal">Ghazal</SelectItem>
                          <SelectItem value="haiku">Haiku</SelectItem>
                          <SelectItem value="acrostic">Acrostic</SelectItem>
                          <SelectItem value="limerick">Limerick</SelectItem>
                          <SelectItem value="free verse">Free verse</SelectItem>
                          <SelectItem value="sonnet">Sonnet</SelectItem>
                          <SelectItem value="elegy">Elegy</SelectItem>
                          <SelectItem value="villanelle">Villanelle</SelectItem>
                          <SelectItem value="ode">Ode</SelectItem>
                          <SelectItem value="ballad">Ballad</SelectItem>
                          <SelectItem value="epic">Epic</SelectItem>
                          <SelectItem value="blank verse">Blank verse</SelectItem>
                          <SelectItem value="sestina">Sestina</SelectItem>
                          <SelectItem value="lyric poetry">
                            Lyric poetry
                          </SelectItem>
                          <SelectItem value="cinquain">Cinquain</SelectItem>
                          <SelectItem value="occasional poetry">
                            Occasional poetry
                          </SelectItem>
                          <SelectItem value="couplet">Couplet</SelectItem>
                          <SelectItem value="pastoral">Pastoral</SelectItem>
                          <SelectItem value="blackout poetry">
                            Blackout poetry
                          </SelectItem>
                          <SelectItem value="ekphrastic">Ekphrastic</SelectItem>
                          <SelectItem value="pantoum">Pantoum</SelectItem>
                          <SelectItem value="prose poetry">
                            Prose poetry
                          </SelectItem>
                          <SelectItem value="dramatic poetry">
                            Dramatic poetry
                          </SelectItem>
                          <SelectItem value="epitaph">Epitaph</SelectItem>
                        </SelectContent>
                      </Select>
                       <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRefreshPoem}
                        disabled={isLoadingPoem || !imageDataUri}
                        aria-label="Regenerate poem"
                      >
                        {isLoadingPoem ? (
                           <LoaderCircle className="animate-spin" />
                        ) : (
                          <RefreshCw />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div
                    className="relative min-h-[250px] rounded-lg bg-cover bg-center p-8 text-white"
                    style={{backgroundImage: "url('/poem-background.png')"}}
                  >
                    {isLoadingPoem ? (
                      <div className="space-y-3 pt-2">
                        <Skeleton className="h-5 w-full bg-gray-400/50" />
                        <Skeleton className="h-5 w-5/6 bg-gray-400/50" />
                        <Skeleton className="h-5 w-full bg-gray-400/50" />
                        <Skeleton className="h-5 w-4/6 bg-gray-400/50" />
                        <Skeleton className="h-5 w-2/3 bg-gray-400/50" />
                      </div>
                    ) : poem ? (
                      isDevelopment ? (
                        <Textarea
                          value={poem}
                          onChange={(e) => {
                            setPoem(e.target.value);
                            setDisplayedPoem(e.target.value);
                          }}
                          placeholder="Your generated text..."
                          className="font-body h-full min-h-[200px] w-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-inherit focus-visible:ring-0 md:text-lg whitespace-pre-wrap text-white"
                        />
                      ) : (
                        <p className="font-body whitespace-pre-wrap text-base leading-relaxed text-white md:text-lg">
                          {displayedPoem}
                        </p>
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-center text-muted-foreground">
                          Upload a photo to watch poetry unfold.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {isDevelopment && poem && !isLoadingPoem && (
                  <div className="space-y-4 rounded-lg border bg-card/50 p-4 shadow-sm">
                    <h3 className="font-headline text-2xl text-foreground">
                      Refine Your Verse
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="feedback" className="text-sm text-muted-foreground">
                        Tell the AI what to change (e.g., "make it happier")
                      </Label>
                      <Input
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Your feedback..."
                        className="bg-background"
                      />
                    </div>
                    <Button
                      onClick={handleRefinePoem}
                      disabled={isRefiningPoem || !feedback}
                      className="w-full sm:w-auto"
                    >
                      {isRefiningPoem ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <Sparkles />
                      )}
                      <span>Refine with AI</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="text-to-photo">
            <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Text Column */}
              <div className="flex flex-col space-y-4">
                <h2 className="font-headline text-3xl font-semibold tracking-tight text-primary md:text-4xl">
                  Your Masterpiece
                </h2>
                <Textarea
                  value={poem}
                  onChange={(e) => setPoem(e.target.value)}
                  placeholder="Write your poem, shayari, or ghazal here..."
                  className="h-full min-h-[300px] w-full resize-y text-lg"
                />
                <Button
                  size="lg"
                  onClick={handleGeneratePhoto}
                  disabled={isLoadingPhoto || !poem}
                >
                  {isLoadingPhoto ? (
                    <LoaderCircle className="mr-2 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2" />
                  )}
                  Generate Photo
                </Button>
              </div>
              {/* Generated Image Column */}
              <div className="flex flex-col gap-4">
                <Card className="overflow-hidden shadow-lg">
                  <CardContent className="p-0">
                    <div className="aspect-[3/2] w-full bg-muted">
                      {isLoadingPhoto ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                        </div>
                      ) : generatedImageUrl ? (
                        <Image
                          src={generatedImageUrl}
                          alt="Generated from text"
                          width={1200}
                          height={800}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-center text-muted-foreground">
                            Your generated image will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleDownload}
                    disabled={!generatedImageUrl && !(mode === 'photo-to-text' && imageUrl)}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleShare}
                    disabled={!generatedImageUrl && !(mode === 'photo-to-text' && imageUrl)}
                  >
                    <Share2 className="mr-2 h-5 w-5" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="mt-auto py-8">
        <div className="container mx-auto flex flex-col items-center gap-4">
          <div className="flex justify-center gap-4">
            <a href="https://www.instagram.com/satyam__m007?igsh=Z3VnZzBycnFhMndp" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-12 w-12 items-center justify-center rounded-full border border-border/20 bg-card/10 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <Instagram className="h-6 w-6 text-foreground/80" />
            </a>
            <a href="https://t.me/Satyam_m007" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="flex h-12 w-12 items-center justify-center rounded-full border border-border/20 bg-card/10 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <Send className="h-6 w-6 text-foreground/80" />
            </a>
            <a href="https://www.linkedin.com/in/satyam-m007?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-12 w-12 items-center justify-center rounded-full border border-border/20 bg-card/10 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <Linkedin className="h-6 w-6 text-foreground/80" />
            </a>
            <a href="https://x.com/Satyam_m007?t=DxQ20RxhWYtdMGVVcZUVhw&s=09" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="flex h-12 w-12 items-center justify-center rounded-full border border-border/20 bg-card/10 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <Twitter className="h-6 w-6 text-foreground/80" />
            </a>
          </div>
          <div className="text-center font-brush text-2xl text-foreground/80">
            <p className="mb-2">Designed and created by</p><p>Satyam Mishra</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
