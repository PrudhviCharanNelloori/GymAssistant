import { TestBed } from '@angular/core/testing';
import { RestTimerService } from './rest-timer.service';

describe('RestTimerService', () => {
  let timer: RestTimerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RestTimerService],
    });
    timer = TestBed.inject(RestTimerService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    timer.stop();
    vi.useRealTimers();
  });

  it('counts down and stops at zero', () => {
    timer.start(3);
    expect(timer.isActive()).toBe(true);
    expect(timer.secondsRemaining()).toBe(3);

    vi.advanceTimersByTime(1000);
    expect(timer.secondsRemaining()).toBe(2);

    vi.advanceTimersByTime(2000);
    expect(timer.isActive()).toBe(false);
    expect(timer.secondsRemaining()).toBe(0);
  });

  it('pauses, resumes, adjusts, and skips', () => {
    timer.start(30);
    timer.pause();
    expect(timer.isRunning()).toBe(false);

    vi.advanceTimersByTime(5000);
    expect(timer.secondsRemaining()).toBe(30);

    timer.resume();
    timer.addSeconds(15);
    expect(timer.secondsRemaining()).toBe(45);

    timer.addSeconds(-20);
    expect(timer.secondsRemaining()).toBe(25);

    timer.skip();
    expect(timer.isActive()).toBe(false);
  });
});
